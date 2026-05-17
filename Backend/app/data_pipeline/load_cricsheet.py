import os
import sys
import json
import requests
from datetime import datetime
from sqlalchemy.orm import Session

# Add the Backend directory to the sys path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, engine, Base
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.player import Player

import zipfile
import io

# URL for PSL matches (smaller download than all T20s)
MATCH_ZIP_URL = "https://cricsheet.org/downloads/psl_json.zip"

def get_phase(over: int, match_type: str) -> str:
    """Basic logic to determine the match phase based on over number."""
    if match_type == "T20":
        if over < 6: return "Powerplay"
        elif over < 15: return "Middle"
        else: return "Death"
    elif match_type == "ODI":
        if over < 10: return "Powerplay 1"
        elif over < 40: return "Middle"
        else: return "Death"
    return "Unknown"

def load_match_data():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    print(f"Downloading match data from {MATCH_ZIP_URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    response = requests.get(MATCH_ZIP_URL, headers=headers)
    response.raise_for_status()
    
    print("Extracting zip file...")
    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
        # Find the first JSON file that isn't README.txt
        json_files = [f for f in z.namelist() if f.endswith('.json')]
        if not json_files:
            print("No JSON files found in the zip.")
            return
            
        target_file = json_files[0]
        print(f"Parsing match file: {target_file}")
        with z.open(target_file) as f:
            data = json.load(f)
    
    info = data["info"]
    innings = data["innings"]
    
    match_type = info.get("match_type", "Unknown")
    cricsheet_id = str(info.get("registry", {}).get("people", {})) # Hacky way to get a unique id if not present, but usually URL is ID
    cricsheet_id = MATCH_JSON_URL.split("/")[-1].replace(".json", "")
    
    date_str = info.get("dates", ["2000-01-01"])[0]
    match_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    teams = info.get("teams", ["Team 1", "Team 2"])
    team_1 = teams[0]
    team_2 = teams[1] if len(teams) > 1 else "Unknown"
    
    toss = info.get("toss", {})
    winner = info.get("outcome", {}).get("winner", "Draw/Tie")
    
    db = SessionLocal()
    
    # 1. Check if match already exists
    existing_match = db.query(Match).filter(Match.cricsheet_match_id == cricsheet_id).first()
    if existing_match:
        print("Match already exists in database. Skipping.")
        db.close()
        return

    # 2. Insert Match
    print("Inserting match data...")
    new_match = Match(
        cricsheet_match_id=cricsheet_id,
        match_type=match_type,
        venue=info.get("venue", "Unknown"),
        city=info.get("city", "Unknown"),
        start_date=match_date,
        team_1=team_1,
        team_2=team_2,
        winner=winner
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    
    # 3. Collect distinct players
    print("Extracting and inserting players...")
    players_set = set()
    for inn in innings:
        for over_data in inn.get("overs", []):
            for delivery in over_data.get("deliveries", []):
                players_set.add(delivery.get("batter"))
                players_set.add(delivery.get("bowler"))
                players_set.add(delivery.get("non_striker"))
    
    for p_name in players_set:
        if p_name:
            if not db.query(Player).filter(Player.name == p_name).first():
                db.add(Player(name=p_name))
    db.commit()
    
    # 4. Insert Deliveries
    print("Inserting ball-by-ball deliveries...")
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
                
                wicket_type = wickets[0].get("kind") if wickets else None
                player_out = wickets[0].get("player_out") if wickets else None
                
                d = Delivery(
                    match_id=new_match.id,
                    innings_number=inn_idx + 1,
                    over_number=over_num,
                    ball_number=ball_idx + 1,
                    batting_team=batting_team,
                    bowling_team=bowling_team,
                    batter=delivery.get("batter"),
                    bowler=delivery.get("bowler"),
                    non_striker=delivery.get("non_striker"),
                    runs_batter=runs.get("batter", 0),
                    runs_extras=runs.get("extras", 0),
                    runs_total=runs.get("total", 0),
                    wicket_type=wicket_type,
                    player_out=player_out,
                    phase=phase
                )
                deliveries_to_insert.append(d)
                
    db.bulk_save_objects(deliveries_to_insert)
    db.commit()
    print(f"Successfully inserted match {cricsheet_id} with {len(deliveries_to_insert)} deliveries.")
    db.close()

if __name__ == "__main__":
    load_match_data()
