import os
import sys

# Add root directory to path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import all models to register them with SQLAlchemy Base (prevents relationship errors)
import app.models.match
import app.models.delivery
import app.models.player
import app.models.team
import app.models.team_season
import app.models.team_season_player

from app.core.database import SessionLocal
from app.models.match import Match
from app.core.helpers import normalize_venue_name

def main():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        print("Fetching all matches...")
        matches = db.query(Match).all()
        updated_count = 0
        
        print("Normalizing match venues...")
        for match in matches:
            original_venue = match.venue
            normalized_venue = normalize_venue_name(original_venue)
            if original_venue != normalized_venue:
                match.venue = normalized_venue
                updated_count += 1
                
        if updated_count > 0:
            print(f"Commiting updates: {updated_count} matches normalized.")
            db.commit()
            print("Successfully normalized all existing database venues!")
        else:
            print("No matches required normalization.")
            
    except Exception as e:
        print(f"Error during venue normalization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
