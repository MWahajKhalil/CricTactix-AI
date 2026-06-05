from typing import Optional, cast
import os
import zipfile
import json

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func, or_, and_

from app.core.config import settings
from app.core.database import get_db
from app.models.delivery import Delivery
from app.models.match import Match
from app.schemas.matches import (
    MatchesResponse,
    TopWinnersResponse,
    TopVenuesResponse,
    MatchDetailResponse,
    WinPercentagesResponse,
)
from app.core.helpers import (
    TEAM_ALIAS_MAP,
    VENUE_ALIAS_MAP,
    alias_values_for_term,
)
from app.services.match_service import (
    build_scorecard_from_deliveries,
    get_highest_run_scorer,
    get_highest_run_scorer_by_player,
    get_highest_wicket_taker,
)

router = APIRouter(
    prefix="/matches",
    tags=["Matches"],
)

# ============================================================================
# FILTER HELPERS
# ============================================================================

def build_team_conditions(term: str, alias_map_values: list[str]) -> list:
    """Build OR conditions for a single team search term."""
    conditions = [Match.team_1.ilike(f"%{term}%"), Match.team_2.ilike(f"%{term}%")]
    if alias_map_values:
        conditions.append(Match.team_1.in_(alias_map_values))
        conditions.append(Match.team_2.in_(alias_map_values))
    return conditions


def apply_team_filter(query, team: Optional[str], team_2: Optional[str]):
    """Apply team/team_2 filtering to query. Handles bidirectional team matching."""
    if not team:
        return query
    
    team_term = team.strip()
    team_alias_values = alias_values_for_term(team, TEAM_ALIAS_MAP)
    
    if team_2:
        # Bidirectional: (team_1=team AND team_2=team_2) OR (team_1=team_2 AND team_2=team)
        team_2_term = team_2.strip()
        team_2_alias_values = alias_values_for_term(team_2, TEAM_ALIAS_MAP)
        
        team_1_match = build_team_conditions(team_term, team_alias_values)
        team_2_match = build_team_conditions(team_2_term, team_2_alias_values)
        reverse_team_1_match = build_team_conditions(team_2_term, team_2_alias_values)
        reverse_team_2_match = build_team_conditions(team_term, team_alias_values)
        
        return query.filter(
            or_(
                and_(or_(*team_1_match), or_(*team_2_match)),
                and_(or_(*reverse_team_1_match), or_(*reverse_team_2_match)),
            )
        )
    else:
        # Broad search across all fields
        broad_conditions = [
            Match.team_1.ilike(f"%{team_term}%"),
            Match.team_2.ilike(f"%{team_term}%"),
            Match.venue.ilike(f"%{team_term}%"),
            Match.city.ilike(f"%{team_term}%"),
            Match.winner.ilike(f"%{team_term}%"),
        ]
        if team_alias_values:
            broad_conditions.extend([
                Match.team_1.in_(team_alias_values),
                Match.team_2.in_(team_alias_values),
                Match.venue.in_(team_alias_values),
                Match.winner.in_(team_alias_values),
            ])
        return query.filter(or_(*broad_conditions))


def apply_team_2_filter(query, team_2: Optional[str]):
    """Apply team_2 specific filtering."""
    if not team_2:
        return query
    
    team_2_term = team_2.strip()
    conditions = [Match.team_2.ilike(f"%{team_2_term}%")]
    alias_values = alias_values_for_term(team_2, TEAM_ALIAS_MAP)
    if alias_values:
        conditions.append(Match.team_2.in_(alias_values))
    return query.filter(or_(*conditions))


def apply_search_filter(query, search: Optional[str]):
    """Apply general text search filter."""
    if not search:
        return query
    
    search_term = f"%{search.strip()}%"
    conditions = [
        Match.team_1.ilike(search_term),
        Match.team_2.ilike(search_term),
        Match.venue.ilike(search_term),
        Match.city.ilike(search_term),
        Match.winner.ilike(search_term),
    ]
    alias_values = alias_values_for_term(search, TEAM_ALIAS_MAP) + alias_values_for_term(search, VENUE_ALIAS_MAP)
    if alias_values:
        conditions.extend([
            Match.team_1.in_(alias_values),
            Match.team_2.in_(alias_values),
            Match.venue.in_(alias_values),
            Match.winner.in_(alias_values),
        ])
    return query.filter(or_(*conditions))


def apply_winner_filter(query, winner: Optional[str]):
    """Apply winner filtering."""
    if not winner:
        return query
    
    winner_term = winner.strip()
    conditions = [Match.winner.ilike(f"%{winner_term}%")]
    alias_values = alias_values_for_term(winner, TEAM_ALIAS_MAP)
    if alias_values:
        conditions.append(Match.winner.in_(alias_values))
    return query.filter(or_(*conditions))


def apply_venue_filter(query, venue: Optional[str], venue_fuzzy: bool = False):
    """Apply venue filtering with optional fuzzy/alias matching."""
    if not venue:
        return query
    
    venue_term = venue.strip()
    conditions = [Match.venue.ilike(f"%{venue_term}%")]
    if venue_fuzzy:
        alias_values = alias_values_for_term(venue, VENUE_ALIAS_MAP)
        if alias_values:
            conditions.append(Match.venue.in_(alias_values))
    return query.filter(or_(*conditions))


def apply_year_filter(query, year: Optional[int], year_from: Optional[int], year_to: Optional[int]):
    """Apply year filtering."""
    if year:
        return query.filter(extract("year", Match.start_date) == year)
    
    if year_from:
        query = query.filter(extract("year", Match.start_date) >= year_from)
    
    if year_to:
        query = query.filter(extract("year", Match.start_date) <= year_to)
    
    return query


# ============================================================================
# ROUTE ENDPOINTS
# ============================================================================

@router.get("/", response_model=MatchesResponse)
def get_all_matches(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="General text search across teams, venue, city, and winner."),
    team: Optional[str] = Query(None, description="Merged team/search filter. Acts as team 1 lookup when team_2 is present, otherwise broad search."),
    team_2: Optional[str] = Query(None, description="Partial or full team 2 name filter."),
    winner: Optional[str] = Query(None, description="Partial or full winner name filter."),
    match_type: Optional[str] = Query(None, description="Partial match type filter, e.g. T20."),
    city: Optional[str] = Query(None, description="Partial city name filter."),
    venue: Optional[str] = Query(None, description="Venue filter."),
    venue_fuzzy: bool = Query(False, description="Enable alias-aware venue matching for stadium variants."),
    year: Optional[int] = Query(None, ge=1800, le=3000, description="Exact year filter."),
    year_from: Optional[int] = Query(None, ge=1800, le=3000),
    year_to: Optional[int] = Query(None, ge=1800, le=3000),
    has_winner: Optional[bool] = Query(None, description="Show only matches with a recorded winner when true."),
    db: Session = Depends(get_db),
):
    """
    Fetch loaded matches with optional pagination and filters.
    """
    query = db.query(Match)
    
    # Apply filters
    query = apply_team_filter(query, team, team_2)
    if not team:
        query = apply_team_2_filter(query, team_2)
    query = apply_search_filter(query, search if not team else None)
    query = apply_winner_filter(query, winner)
    
    if match_type:
        query = query.filter(Match.match_type.ilike(f"%{match_type}%"))
    
    if city:
        query = query.filter(Match.city.ilike(f"%{city}%"))
    
    query = apply_venue_filter(query, venue, venue_fuzzy)
    query = apply_year_filter(query, year, year_from, year_to)
    
    if has_winner is True:
        query = query.filter(Match.winner.isnot(None), Match.winner != "")
    elif has_winner is False:
        query = query.filter((Match.winner.is_(None)) | (Match.winner == ""))

    total = query.count()

    if total == 0:
        return {"count": 0, "page": page, "per_page": per_page, "matches": []}

    matches = (
        query.order_by(Match.start_date.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    match_ids = [m.id for m in matches]
    delivery_counts = {
        row[0]: row[1]
        for row in db.query(Delivery.match_id, func.count().label("delivery_count"))
        .filter(Delivery.match_id.in_(match_ids))
        .group_by(Delivery.match_id)
        .all()
    }

    return {
        "count": total,
        "page": page,
        "per_page": per_page,
        "matches": [
            {
                "id": m.id,
                "cricsheet_id": m.cricsheet_match_id,
                "date": m.start_date,
                "team_1": m.team_1,
                "team_2": m.team_2,
                "winner": m.winner,
                "match_type": m.match_type,
                "venue": m.venue,
                "city": m.city,
                "has_scorecard": delivery_counts.get(m.id, 0) > 0,
                "player_of_match": m.player_of_match,
                "toss_winner": m.toss_winner,
                "toss_decision": m.toss_decision,
                "win_by_runs": m.win_by_runs,
                "win_by_wickets": m.win_by_wickets,
                "season": m.season,
            }
            for m in matches
        ],
    }


@router.get("/stats/top-winners", response_model=TopWinnersResponse)
def get_top_winners(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return top winning teams based on wins count."""
    winners = (
        db.query(Match.winner, func.count().label("wins"))
        .filter(Match.winner.isnot(None), Match.winner != "")
        .group_by(Match.winner)
        .order_by(desc("wins"))
        .limit(limit)
        .all()
    )

    return {
        "top_winners": [
            {"team": row[0], "wins": row[1]}
            for row in winners
        ]
    }


@router.get("/stats/win-percentages", response_model=WinPercentagesResponse)
def get_win_percentages(db: Session = Depends(get_db)):
    """Return win percentages for all teams, sorted by win percentage descending."""
    matches = db.query(Match.team_1, Match.team_2, Match.winner).all()
    
    stats = {}
    for m in matches:
        t1, t2, winner = m.team_1, m.team_2, m.winner
        if t1:
            stats.setdefault(t1, {"played": 0, "won": 0})
            stats[t1]["played"] += 1
        if t2:
            stats.setdefault(t2, {"played": 0, "won": 0})
            stats[t2]["played"] += 1
        if winner and winner in stats:
            stats[winner]["won"] += 1
            
    result = []
    for team, data in stats.items():
        played = data["played"]
        won = data["won"]
        pct = (won / played * 100) if played > 0 else 0.0
        result.append({
            "team": team,
            "played": played,
            "won": won,
            "win_percentage": round(pct, 1)
        })
        
    result.sort(key=lambda x: x["win_percentage"], reverse=True)
    return {"win_percentages": result}


@router.get("/stats/top-venues", response_model=TopVenuesResponse)
def get_top_venues(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Return top venues based on matches count."""
    venues = (
        db.query(Match.venue, func.count().label("matches"))
        .group_by(Match.venue)
        .order_by(desc("matches"))
        .limit(limit)
        .all()
    )

    return {
        "top_venues": [
            {"venue": row[0], "matches": row[1]}
            for row in venues
        ]
    }


@router.get("/{match_id}", response_model=MatchDetailResponse)
def get_match_by_id(match_id: int, db: Session = Depends(get_db)):
    """Return single match details with aggregated scorecard innings, FoW, and yet to bat rosters."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    roster_map = {}
    player_of_match = match.player_of_match
    toss_winner = match.toss_winner
    toss_decision = match.toss_decision
    win_by_runs = match.win_by_runs
    win_by_wickets = match.win_by_wickets
    season = match.season
    umpires = []
    tv_umpire = None
    match_referee = None

    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    zip_path = os.path.join(backend_dir, "data", "raw", "psl_json.zip")
    if os.path.exists(zip_path):
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                filename = f"{match.cricsheet_match_id}.json"
                if filename in z.namelist():
                    with z.open(filename) as f:
                        data = json.load(f)
                    info = data.get("info", {})
                    roster_map = info.get("players", {})
                    
                    officials = info.get("officials", {})
                    umpires = officials.get("umpires", [])
                    tv_umpires = officials.get("tv_umpires", [])
                    tv_umpire = tv_umpires[0] if tv_umpires else None
                    match_referees = officials.get("match_referees", [])
                    match_referee = match_referees[0] if match_referees else None
        except Exception as e:
            print(f"Error loading zip file for rosters: {e}")

    match_info = {
        "id": match.id,
        "cricsheet_id": match.cricsheet_match_id,
        "date": match.start_date,
        "team_1": match.team_1,
        "team_2": match.team_2,
        "winner": match.winner,
        "match_type": match.match_type,
        "venue": match.venue,
        "city": match.city,
        
        "player_of_match": player_of_match,
        "toss_winner": toss_winner,
        "toss_decision": toss_decision,
        "win_by_runs": win_by_runs,
        "win_by_wickets": win_by_wickets,
        "season": season,
        "umpires": umpires,
        "tv_umpire": tv_umpire,
        "match_referee": match_referee,
        "match_report": None,
    }

    # Retrieve match report if it exists
    reports_dir = os.path.abspath(settings.REPORTS_DIR)
    try:
        cid = int(match.cricsheet_match_id)
        filename = None
        if 1527552 <= cid <= 1527591:
            filename = f"2026_match_{(cid - 1527551):02d}_report.txt"
        elif cid == 1527592:
            filename = "2026_qualifier_report.txt"
        elif cid == 1527593:
            filename = "2026_eliminator_1_report.txt"
        elif cid == 1527594:
            filename = "2026_eliminator_2_report.txt"
        elif cid == 1527595:
            filename = "2026_final_report.txt"
            
        if filename:
            filepath = os.path.join(reports_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    match_info["match_report"] = f.read()
    except Exception as e:
        print(f"Error loading report: {e}")

    deliveries = db.query(Delivery).filter(Delivery.match_id == match.id).order_by(
        Delivery.innings_number,
        Delivery.over_number,
        Delivery.ball_number,
    ).all()

    innings_list = build_scorecard_from_deliveries(deliveries)
    
    # Enrich each innings with "yet_to_bat"
    for innings in innings_list:
        batting_team = innings["batting_team"]
        roster = roster_map.get(batting_team, [])
        
        batters_faced = {b["player"] for b in innings["batting"]}
        yet_to_bat = [player for player in roster if player not in batters_faced]
        innings["yet_to_bat"] = yet_to_bat

    match_info["scorecard"] = {"innings": innings_list}

    return match_info



@router.get("/stats/highest-run-scorer")
def get_highest_run_scorer_route(db: Session = Depends(get_db)):
    """Return leading cumulative run scorer of all matches."""
    res = get_highest_run_scorer(db)
    if not res:
        raise HTTPException(status_code=404, detail="No delivery data found")
    return {"highest_run_scorer": res}


@router.get("/stats/highest-run-scorer-by-player")
def get_highest_run_scorer_by_player_route(player: str, db: Session = Depends(get_db)):
    """Return a specific player's highest innings score in a single match."""
    res = get_highest_run_scorer_by_player(player, db)
    if not res:
        raise HTTPException(status_code=404, detail=f"No delivery data found for player: {player}")
    return {"highest_run_scorer": res}


@router.get("/stats/highest-wicket-taker")
def get_highest_wicket_taker_route(db: Session = Depends(get_db)):
    """Return all-time leading bowler wickets taker."""
    res = get_highest_wicket_taker(db)
    if not res:
        raise HTTPException(status_code=404, detail="No bowling data found")
    return {"highest_wicket_taker": res}


@router.post("/stats/seed-database")
def seed_database(background_tasks: BackgroundTasks):
    """
    Triggers database seeding from raw Cricsheet PSL zip file in the background.
    """
    from app.data_pipeline.load_cricsheet import load_match_data
    
    background_tasks.add_task(load_match_data)
    
    return {
        "status": "success",
        "message": "Database seeding has been triggered in the background. It will populate all matches and deliveries shortly."
    }
