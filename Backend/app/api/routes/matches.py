
from typing import Optional, cast

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func, or_, and_

from app.core.database import get_db
from app.models.delivery import Delivery
from app.models.match import Match

router = APIRouter(
    prefix="/matches",
    tags=["Matches"],
)

TEAM_ALIAS_MAP = {
    "lahore": ["Lahore Qalandars"],
    "lahore qalandars": ["Lahore Qalandars"],
    "karachi": ["Karachi Kings"],
    "karachi kings": ["Karachi Kings"],
    "hyderabad": ["Hyderabad Kingsmen"],
    "hyderabad kingsmen": ["Hyderabad Kingsmen"],
    "islamabad": ["Islamabad United"],
    "islamabad united": ["Islamabad United"],
    "peshawar": ["Peshawar Zalmi"],
    "peshawar zalmi": ["Peshawar Zalmi"],
    "quetta": ["Quetta Gladiators"],
    "quetta gladiators": ["Quetta Gladiators"],
    "multan": ["Multan Sultans"],
    "multan sultans": ["Multan Sultans"],
    "rawalpindi": ["Rawalpindiz"],
    "rawalpindiz": ["Rawalpindiz"],
}

VENUE_ALIAS_MAP = {
    "gaddafi": ["Gaddafi Stadium", "Gaddafi Stadium, Lahore"],
    "gaddafi stadium": ["Gaddafi Stadium", "Gaddafi Stadium, Lahore"],
    "national": ["National Stadium", "National Stadium, Karachi"],
    "national stadium": ["National Stadium", "National Stadium, Karachi"],
    "multan": ["Multan Cricket Stadium"],
    "rawalpindi": ["Rawalpindi Cricket Stadium"],
    "rawalpindi cricket": ["Rawalpindi Cricket Stadium"],
    "sharjah": ["Sharjah Cricket Stadium"],
    "sheikh zayed": ["Sheikh Zayed Stadium", "Sheikh Zayed Stadium, Abu Dhabi"],
    "dubai": ["Dubai International Cricket Stadium"],
    "dubai international": ["Dubai International Cricket Stadium"],
    "abu dhabi": ["Sheikh Zayed Stadium", "Sheikh Zayed Stadium, Abu Dhabi"],
}


def normalize_alias_key(value: Optional[str]) -> str:
    return value.strip().lower() if value and value.strip() else ""


def alias_values_for_term(value: Optional[str], alias_map: dict[str, list[str]]) -> list[str]:
    normalized = normalize_alias_key(value)
    return alias_map.get(normalized, [])


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
# SCORECARD HELPERS
# ============================================================================

def calculate_batting_stats(player: str, stats: dict) -> dict:
    """Calculate batting statistics for a player."""
    balls = stats["balls"]
    strike_rate = (stats["runs"] / balls * 100) if balls > 0 else 0.0
    return {
        "player": player,
        "runs": stats["runs"],
        "balls": balls,
        "strike_rate": round(strike_rate, 1),
    }


def calculate_bowling_stats(player: str, stats: dict) -> dict:
    """Calculate bowling statistics for a player."""
    balls = stats["balls"]
    overs = f"{balls // 6}.{balls % 6}" if balls > 0 else "0.0"
    economy = (stats["runs_conceded"] / (balls / 6)) if balls > 0 else 0.0
    return {
        "player": player,
        "overs": overs,
        "runs_conceded": stats["runs_conceded"],
        "wickets": stats["wickets"],
        "economy": round(economy, 2),
    }


def build_scorecard_from_deliveries(deliveries: list[Delivery]) -> list[dict]:
    """Aggregate deliveries into innings scorecards."""
    innings_map: dict[int, dict] = {}
    
    # Aggregate deliveries into innings
    for d in deliveries:
        innings = innings_map.setdefault(cast(int, d.innings_number), {
            "innings_number": d.innings_number,
            "batting_team": d.batting_team,
            "bowling_team": d.bowling_team,
            "batting": {},
            "bowling": {},
            "runs": 0,
            "balls": 0,
            "wickets": 0,
            "extras": 0,
        })
        
        innings["runs"] += (d.runs_total or 0)
        innings["extras"] += (d.runs_extras or 0)
        if d.player_out:  # type: ignore
            innings["wickets"] += 1
        
        # Track batting stats
        batter = d.batter or "Unknown"
        batting = innings["batting"].setdefault(batter, {"runs": 0, "balls": 0})
        batting["runs"] += (d.runs_batter or 0)
        
        is_wide = (d.runs_extras or 0) > 0 and (d.runs_batter or 0) == 0 and d.wicket_type is None and (d.runs_total or 0) > 0
        if not is_wide:  # type: ignore
            batting["balls"] += 1
            innings["balls"] += 1
        
        # Track bowling stats
        bowler = d.bowler or "Unknown"
        bowling = innings["bowling"].setdefault(bowler, {"runs_conceded": 0, "balls": 0, "wickets": 0})
        bowling["runs_conceded"] += (d.runs_total or 0)
        if not is_wide:  # type: ignore
            bowling["balls"] += 1
        if d.player_out:  # type: ignore
            bowling["wickets"] += 1
    
    # Format innings data
    innings_list = []
    for innings_number in sorted(innings_map):
        innings = innings_map[innings_number]
        
        # Format batting
        batting_list = [
            calculate_batting_stats(player, stats)
            for player, stats in sorted(innings["batting"].items(), key=lambda x: (-x[1]["runs"], x[0]))
        ]
        
        # Format bowling
        bowling_list = [
            calculate_bowling_stats(player, stats)
            for player, stats in sorted(innings["bowling"].items(), key=lambda x: (-x[1]["wickets"], x[0]))
        ]
        
        overs = f"{innings['balls'] // 6}.{innings['balls'] % 6}" if innings["balls"] > 0 else "0.0"
        
        innings_list.append({
            "innings_number": innings["innings_number"],
            "batting_team": innings["batting_team"],
            "bowling_team": innings["bowling_team"],
            "batting": batting_list,
            "bowling": bowling_list,
            "total_runs": innings["runs"],
            "wickets": innings["wickets"],
            "extras": innings["extras"],
            "overs": overs,
        })
    
    return innings_list


# This endpoint is used by the frontend to fetch a paginated list of matches with optional filters. It supports filtering by team, match type, year, venue (with optional fuzzy matching), and winner. The results are returned in a structured format that includes pagination metadata.

@router.get("/")
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

    - `page` and `per_page` control pagination.
    - `search` performs a broad text search across teams, venue, city, and winner.
    - `team` and `team_2` support merged team filter behavior.
    - `winner`, `match_type`, `city`, and `venue` support partial matching.
    - `venue_fuzzy` enables wildcard venue matching.
    - `year_from` / `year_to` filter by start year range.
    - `has_winner=true` returns only matches with a final winner.
    """

    query = db.query(Match)
    
    # Apply filters
    query = apply_team_filter(query, team, team_2)
    if not team:  # Only apply standalone team_2 if team not provided
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
        return {"count": 0, "matches": []}

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
            }
            for m in matches
        ],
    }


#this endpoint is used by the frontend dashboard to show the top winning teams in the dataset. It aggregates the matches by winner and counts the number of wins for each team, then returns the top N teams based on the specified limit. This allows users to quickly see which teams have been most successful in the matches loaded into the system.
@router.get("/stats/top-winners")
def get_top_winners(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
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

@router.get("/stats/top-venues")
def get_top_venues(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
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

#this endpoint is used by the frontend to fetch match details when a user clicks on a match from the list. It returns all relevant information about the match, which can then be displayed on the match detail page. 
@router.get("/{match_id}")
def get_match_by_id(match_id: int, db: Session = Depends(get_db)):
    """Return single match details by internal ID."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Basic match info
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
    }

    # Build scorecard from deliveries
    deliveries = db.query(Delivery).filter(Delivery.match_id == match.id).order_by(
        Delivery.innings_number,
        Delivery.over_number,
        Delivery.ball_number,
    ).all()

    match_info["scorecard"] = {"innings": build_scorecard_from_deliveries(deliveries)}

    return match_info
