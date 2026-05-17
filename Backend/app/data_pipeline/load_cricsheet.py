import os
import sys
import json
from datetime import datetime
from sqlalchemy.orm import Session

# Add the Backend directory to the sys path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, engine, Base
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.player import Player

def get_phase(over: int, match_type: str) -> str:
    if match_type == "T20":
        if over < 6: return "Powerplay"
        elif over < 15: return "Middle"
        else: return "Death"
    return "Unknown"

import zipfile
import io

def load_match_data():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    zip_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw", "psl_json.zip")
    
    if not os.path.exists(zip_path):
        print(f"Error: Could not find zip file at {zip_path}")
        return

    print("Extracting and parsing real Cricsheet data...")
    with zipfile.ZipFile(zip_path, "r") as z:
        json_files = [f for f in z.namelist() if f.endswith('.json')]
        
        # Parse the first 10 matches so it's fast but gives you plenty of real data
        matches_parsed = 0
        for target_file in json_files[:10]:
            print(f"Parsing {target_file}...")
            with z.open(target_file) as f:
                data = json.load(f)
                
            info = data["info"]
            innings = data.get("innings", [])
            
            match_type = info.get("match_type", "Unknown")
            cricsheet_id = target_file.replace(".json", "")
            
            date_str = info.get("dates", ["2000-01-01"])[0]
            match_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            
            teams = info.get("teams", ["Team 1", "Team 2"])
            team_1 = teams[0]
            team_2 = teams[1] if len(teams) > 1 else "Unknown"
            winner = info.get("outcome", {}).get("winner", "Draw/Tie")
            
            db = SessionLocal()
            
            # 1. Check if match already exists
            if db.query(Match).filter(Match.cricsheet_match_id == cricsheet_id).first():
                print(f"Match {cricsheet_id} already exists. Skipping.")
                db.close()
                continue

            # 2. Insert Match
            new_match = Match(
                cricsheet_match_id=cricsheet_id, match_type=match_type,
                venue=info.get("venue", "Unknown"), city=info.get("city", "Unknown"),
                start_date=match_date, team_1=team_1, team_2=team_2, winner=winner
            )
            db.add(new_match)
            db.commit()
            db.refresh(new_match)
            
            # 3. Insert Players
            players_set = set()
            for inn in innings:
                for over_data in inn.get("overs", []):
                    for delivery in over_data.get("deliveries", []):
                        players_set.update([delivery.get("batter"), delivery.get("bowler"), delivery.get("non_striker")])
            
            for p_name in players_set:
                if p_name and not db.query(Player).filter(Player.name == p_name).first():
                    db.add(Player(name=p_name))
            db.commit()
            
            # 4. Insert Deliveries
            deliveries_to_insert = []
            for inn_idx, inn in enumerate(innings):
                batting_team = inn.get("team")
                bowling_team = team_2 if batting_team == team_1 else team_1
                
                for over_data in inn.get("overs", []):
                    over_num = over_data.get("over", 0)
                    phase = get_phase(over_num, match_type)
                    for ball_idx, delivery in enumerate(over_data.get("deliveries", [])):
                        runs = delivery.get("runs", {})
                        wickets = delivery.get("wickets", [])
                        
                        deliveries_to_insert.append(Delivery(
                            match_id=new_match.id, innings_number=inn_idx + 1, over_number=over_num, ball_number=ball_idx + 1,
                            batting_team=batting_team, bowling_team=bowling_team, batter=delivery.get("batter"),
                            bowler=delivery.get("bowler"), non_striker=delivery.get("non_striker"), runs_batter=runs.get("batter", 0),
                            runs_extras=runs.get("extras", 0), runs_total=runs.get("total", 0),
                            wicket_type=wickets[0].get("kind") if wickets else None, player_out=wickets[0].get("player_out") if wickets else None, phase=phase
                        ))
                        
            db.bulk_save_objects(deliveries_to_insert)
            db.commit()
            print(f"Successfully inserted match {cricsheet_id} with {len(deliveries_to_insert)} deliveries.")
            db.close()
            matches_parsed += 1
            
    print(f"Finished parsing {matches_parsed} real matches!")

if __name__ == "__main__":
    load_match_data()
