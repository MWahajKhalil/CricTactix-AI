# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.match import Match

router = APIRouter(
    prefix="/matches",
    tags=["Matches"]
)

@router.get("/")
def get_all_matches(db: Session = Depends(get_db)):
    """
    Fetch all loaded matches from the database.
    """
    matches = db.query(Match).all()
    if not matches:
        return {"message": "No matches found. Did you run the load_cricsheet.py script?"}
    
    return {
        "count": len(matches),
        "matches": [
            {
                "id": m.id,
                "cricsheet_id": m.cricsheet_match_id,
                "date": m.start_date,
                "team_1": m.team_1,
                "team_2": m.team_2,
                "winner": m.winner
            } for m in matches
        ]
    }
