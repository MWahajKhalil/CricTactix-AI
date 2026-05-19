
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func, or_

from app.core.database import get_db
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


# This endpoint is used by the frontend to fetch a paginated list of matches with optional filters. It supports filtering by team, match type, year, venue (with optional fuzzy matching), and winner. The results are returned in a structured format that includes pagination metadata.

@router.get("/")
def get_all_matches(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="General text search across teams, venue, city, and winner."),
    team_1: Optional[str] = Query(None, description="Partial or full team 1 name filter."),
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
    - `team_1`, `team_2`, `winner`, `match_type`, `city`, and `venue` support partial matching.
    - `venue_fuzzy` enables wildcard venue matching.
    - `year_from` / `year_to` filter by start year range.
    - `has_winner=true` returns only matches with a final winner.
    """

    query = db.query(Match)

    if team_1:
        team_1_term = team_1.strip()
        team_1_conditions = [Match.team_1.ilike(f"%{team_1_term}%")]
        alias_values = alias_values_for_term(team_1, TEAM_ALIAS_MAP)
        if alias_values:
            team_1_conditions.append(Match.team_1.in_(alias_values))
        query = query.filter(or_(*team_1_conditions))

    if team_2:
        team_2_term = team_2.strip()
        team_2_conditions = [Match.team_2.ilike(f"%{team_2_term}%")]
        alias_values = alias_values_for_term(team_2, TEAM_ALIAS_MAP)
        if alias_values:
            team_2_conditions.append(Match.team_2.in_(alias_values))
        query = query.filter(or_(*team_2_conditions))

    if search:
        search_term = f"%{search.strip()}%"
        if team_2:
            query = query.filter(Match.team_1.ilike(search_term))
        else:
            search_conditions = [
                Match.team_1.ilike(search_term),
                Match.team_2.ilike(search_term),
                Match.venue.ilike(search_term),
                Match.city.ilike(search_term),
                Match.winner.ilike(search_term),
            ]
            alias_values = alias_values_for_term(search, TEAM_ALIAS_MAP) + alias_values_for_term(search, VENUE_ALIAS_MAP)
            if alias_values:
                search_conditions.append(Match.team_1.in_(alias_values))
                search_conditions.append(Match.team_2.in_(alias_values))
                search_conditions.append(Match.venue.in_(alias_values))
                search_conditions.append(Match.winner.in_(alias_values))
            query = query.filter(or_(*search_conditions))

    if winner:
        winner_term = winner.strip()
        winner_conditions = [Match.winner.ilike(f"%{winner_term}%")]
        alias_values = alias_values_for_term(winner, TEAM_ALIAS_MAP)
        if alias_values:
            winner_conditions.append(Match.winner.in_(alias_values))
        query = query.filter(or_(*winner_conditions))

    if match_type:
        query = query.filter(Match.match_type.ilike(f"%{match_type}%"))

    if city:
        query = query.filter(Match.city.ilike(f"%{city}%"))

    if venue:
        venue_term = venue.strip()
        venue_conditions = [Match.venue.ilike(f"%{venue_term}%")]
        if venue_fuzzy:
            alias_values = alias_values_for_term(venue, VENUE_ALIAS_MAP)
            if alias_values:
                venue_conditions.append(Match.venue.in_(alias_values))
        query = query.filter(or_(*venue_conditions))

    if year:
        query = query.filter(extract("year", Match.start_date) == year)

    if year_from:
        query = query.filter(extract("year", Match.start_date) >= year_from)

    if year_to:
        query = query.filter(extract("year", Match.start_date) <= year_to)

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

    return {
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
