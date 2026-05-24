import os
import sys
import json
from datetime import datetime
import zipfile

# Add the Backend directory to the sys path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, engine, Base
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.player import Player
from app.models.team import Team
from app.models.team_season import TeamSeason
from app.models.team_season_player import TeamSeasonPlayer

def get_phase(over: int, match_type: str) -> str:
    if match_type == "T20":
        if over < 6:
            return "Powerplay"
        elif over < 15:
            return "Middle"
        else:
            return "Death"
    return "Unknown"

def load_match_data():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    zip_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw", "psl_json.zip")
    
    if not os.path.exists(zip_path):
        print(f"Error: Could not find zip file at {zip_path}")
        return

    print("Extracting and parsing real Cricsheet data...")
    with zipfile.ZipFile(zip_path, "r") as z:
        json_files = sorted([f for f in z.namelist() if f.endswith('.json')])
        
        # Parse all available matches by default. Set MATCH_LOAD_LIMIT in the environment
        # to load only a smaller subset for faster testing.
        match_limit = os.getenv("MATCH_LOAD_LIMIT")
        if match_limit and match_limit.isdigit():
            json_files = json_files[: int(match_limit)]
            print(f"Loading first {match_limit} matches due to MATCH_LOAD_LIMIT")

        matches_parsed = 0
        for target_file in json_files:
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

            # 1. Skip if match exists
            if db.query(Match).filter(Match.cricsheet_match_id == cricsheet_id).first():
                print(f"Match {cricsheet_id} already exists. Skipping.")
                db.close()
                continue

            # Resolve or create canonical teams
            team1_obj = db.query(Team).filter(Team.name == team_1).first()
            if not team1_obj:
                team1_obj = Team(name=team_1, short_name=None)
                db.add(team1_obj)
                db.commit()
                db.refresh(team1_obj)

            team2_obj = db.query(Team).filter(Team.name == team_2).first()
            if not team2_obj:
                team2_obj = Team(name=team_2, short_name=None)
                db.add(team2_obj)
                db.commit()
                db.refresh(team2_obj)

            # 2. Insert Match with FK references
            new_match = Match(
                cricsheet_match_id=cricsheet_id,
                match_type=match_type,
                venue=info.get("venue", "Unknown"),
                city=info.get("city", "Unknown"),
                start_date=match_date,
                team_1=team_1,
                team_2=team_2,
                winner=winner,
                team_1_id=team1_obj.id,
                team_2_id=team2_obj.id,
            )
            db.add(new_match)
            db.commit()
            db.refresh(new_match)

            # 3. Collect player names and per-team appearances (from deliveries)
            players_set = set()
            team_appearances: dict = {team_1: set(), team_2: set()}
            for inn in innings:
                batting_team = inn.get("team")
                bowling_team = team_2 if batting_team == team_1 else team_1
                for over_data in inn.get("overs", []):
                    for delivery in over_data.get("deliveries", []):
                        b = delivery.get("batter")
                        bo = delivery.get("bowler")
                        ns = delivery.get("non_striker")
                        for p_name, team_name in ((b, batting_team), (ns, batting_team), (bo, bowling_team)):
                            if p_name:
                                players_set.add(p_name)
                                team_appearances.setdefault(team_name, set()).add(p_name)

            # Ensure Player rows exist
            for p_name in players_set:
                if p_name and not db.query(Player).filter(Player.name == p_name).first():
                    db.add(Player(name=p_name))
            db.commit()

            # 4. Create TeamSeason rows (per team per year) and TeamSeasonPlayer associations
            year = match_date.year
            # team1 season
            ts1 = db.query(TeamSeason).filter(TeamSeason.team_id == team1_obj.id, TeamSeason.year == year).first()
            if not ts1:
                ts1 = TeamSeason(team_id=team1_obj.id, year=year)
                db.add(ts1)
                db.commit()
                db.refresh(ts1)

            # team2 season
            ts2 = db.query(TeamSeason).filter(TeamSeason.team_id == team2_obj.id, TeamSeason.year == year).first()
            if not ts2:
                ts2 = TeamSeason(team_id=team2_obj.id, year=year)
                db.add(ts2)
                db.commit()
                db.refresh(ts2)

            # Create associations for players that appeared for each team in this match
            for team_name, roster in team_appearances.items():
                target_ts = ts1 if team_name == team_1 else ts2
                for p_name in roster:
                    p_obj = db.query(Player).filter(Player.name == p_name).first()
                    if not p_obj:
                        continue
                    exists = db.query(TeamSeasonPlayer).filter(TeamSeasonPlayer.team_season_id == target_ts.id, TeamSeasonPlayer.player_id == p_obj.id).first()
                    if not exists:
                        assoc = TeamSeasonPlayer(team_season_id=target_ts.id, player_id=p_obj.id)
                        db.add(assoc)
            db.commit()

            # 5. Insert Deliveries
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
            print(f"Successfully inserted match {cricsheet_id} with {len(deliveries_to_insert)} deliveries and populated teams/players/seasons.")
            db.close()
            matches_parsed += 1
            
    print(f"Finished parsing {matches_parsed} real matches!")

if __name__ == "__main__":
    load_match_data()
