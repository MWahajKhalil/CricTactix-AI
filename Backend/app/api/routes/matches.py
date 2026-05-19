
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func

from app.core.database import get_db
from app.models.match import Match

router = APIRouter(
    prefix="/matches",
    tags=["Matches"],
)


@router.get("/")
def get_all_matches(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    team: Optional[str] = Query(None),
    match_type: Optional[str] = Query(None),
    year: Optional[int] = Query(None, ge=1800, le=3000),
    venue: Optional[str] = Query(None),
    venue_fuzzy: bool = Query(False, description="Use fuzzy venue matching when true."),
    winner: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Fetch loaded matches with optional pagination and filters.

    - `page` and `per_page` control pagination.
    - `team` filters matches where either team_1 or team_2 matches the value.
    - `match_type` filters by match_type (e.g., T20, ODI).
    - `year` filters by the start_date year.
    - `venue` filters by venue name.
    - `venue_fuzzy` enables case-insensitive partial matching for venue aliases.
    """

    query = db.query(Match)

    if team:
        query = query.filter((Match.team_1 == team) | (Match.team_2 == team))

    if match_type:
        query = query.filter(Match.match_type == match_type)

    if year:
        query = query.filter(extract("year", Match.start_date) == year)

    if venue:
        if venue_fuzzy:
            query = query.filter(Match.venue.ilike(f"%{venue}%"))
        else:
            query = query.filter(Match.venue == venue)

    if winner:
        query = query.filter(Match.winner == winner)

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
            }
            for m in matches
        ],
    }


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
