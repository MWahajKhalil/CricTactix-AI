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
    if match_type and "T20" in match_type.upper():
        if over < 6:
            return "Powerplay"
        elif over < 15:
            return "Middle"
        else:
            return "Death"
    return "Unknown"

def load_match_data():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    zip_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw", "psl_json.zip")
    
    if not os.path.exists(zip_path):
        print(f"Error: Could not find zip file at {zip_path}")
        return

    db = SessionLocal()
    
    try:
        print("Caching existing database entities for high-speed ORM inserts...")
        existing_teams = {t.name: t for t in db.query(Team).all()}
        existing_players = {p.name: p for p in db.query(Player).all()}
        existing_seasons = {(ts.team_id, ts.year): ts for ts in db.query(TeamSeason).all()}
        existing_season_players = {(tsp.team_season_id, tsp.player_id) for tsp in db.query(TeamSeasonPlayer).all()}
        existing_matches = {m.cricsheet_match_id for m in db.query(Match).all()}

        def get_or_create_team(name: str) -> Team:
            if name in existing_teams:
                return existing_teams[name]
            team = Team(name=name, short_name=name.split()[0] if name else None)
            db.add(team)
            db.flush()  # Populates ID in memory without committing
            existing_teams[name] = team
            return team

        def get_or_create_player(name: str) -> Player:
            if name in existing_players:
                return existing_players[name]
            player = Player(name=name)
            db.add(player)
            db.flush()
            existing_players[name] = player
            return player

        def get_or_create_team_season(team_id: int, year: int) -> TeamSeason:
            key = (team_id, year)
            if key in existing_seasons:
                return existing_seasons[key]
            season = TeamSeason(team_id=team_id, year=year)
            db.add(season)
            db.flush()
            existing_seasons[key] = season
            return season

        def ensure_team_season_player(ts_id: int, player_id: int):
            key = (ts_id, player_id)
            if key in existing_season_players:
                return
            assoc = TeamSeasonPlayer(team_season_id=ts_id, player_id=player_id)
            db.add(assoc)
            db.flush()
            existing_season_players.add(key)

        print("Extracting and parsing real Cricsheet data...")
        with zipfile.ZipFile(zip_path, "r") as z:
            json_files = sorted([f for f in z.namelist() if f.endswith('.json')])
            
            match_limit = os.getenv("MATCH_LOAD_LIMIT")
            if match_limit and match_limit.isdigit():
                json_files = json_files[: int(match_limit)]
                print(f"Loading first {match_limit} matches due to MATCH_LOAD_LIMIT")

            matches_parsed = 0
            for target_file in json_files:
                cricsheet_id = target_file.replace(".json", "")
                
                # Skip if already parsed
                if cricsheet_id in existing_matches:
                    continue

                with z.open(target_file) as f:
                    data = json.load(f)
                    
                info = data.get("info", {})
                innings = data.get("innings", [])
                
                match_type = info.get("match_type", "Unknown")
                date_str = info.get("dates", ["2000-01-01"])[0]
                match_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                
                teams = info.get("teams", ["Team 1", "Team 2"])
                team_1 = teams[0]
                team_2 = teams[1] if len(teams) > 1 else "Unknown"
                winner = info.get("outcome", {}).get("winner", "Draw/Tie")
                
                # Resolve or create canonical teams
                team1_obj = get_or_create_team(team_1)
                team2_obj = get_or_create_team(team_2)

                # Insert Match with ORM FK references
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
                db.flush()
                existing_matches.add(cricsheet_id)

                # Collect player roster appearances for this match
                team_appearances = {team_1: set(), team_2: set()}
                players_data = info.get("players", {})
                if players_data:
                    for t_name, p_list in players_data.items():
                        if t_name in team_appearances:
                            team_appearances[t_name].update(p_list)
                else:
                    for inn in innings:
                        batting_team = inn.get("team")
                        bowling_team = team_2 if batting_team == team_1 else team_1
                        for over_data in inn.get("overs", []):
                            for delivery in over_data.get("deliveries", []):
                                b = delivery.get("batter")
                                bo = delivery.get("bowler")
                                ns = delivery.get("non_striker")
                                for p_name, team_name in ((b, batting_team), (ns, batting_team), (bo, bowling_team)):
                                    if p_name and team_name in team_appearances:
                                        team_appearances[team_name].add(p_name)

                # Populate Seasons & Rosters
                year = match_date.year
                ts1 = get_or_create_team_season(team1_obj.id, year)
                ts2 = get_or_create_team_season(team2_obj.id, year)

                for team_name, roster in team_appearances.items():
                    ts = ts1 if team_name == team_1 else ts2
                    for p_name in roster:
                        p_obj = get_or_create_player(p_name)
                        ensure_team_season_player(ts.id, p_obj.id)

                # Build ball-by-ball deliveries
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
                                wicket_type=wickets[0].get("kind") if wickets else None,
                                player_out=wickets[0].get("player_out") if wickets else None,
                                phase=phase
                            ))

                # Batch save match deliveries
                db.bulk_save_objects(deliveries_to_insert)
                matches_parsed += 1
                if matches_parsed % 20 == 0:
                    print(f"Parsed {matches_parsed} matches...")

        # Single atomic commit to disk for maximum speed
        print("Committing all transactions to database disk...")
        db.commit()
        print(f"Successfully loaded and cached {matches_parsed} matches!")

    except Exception as e:
        print(f"Error during loading: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    load_match_data()
