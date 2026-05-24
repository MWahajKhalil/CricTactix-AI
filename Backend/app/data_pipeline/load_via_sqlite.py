import os
import zipfile
import json
import sqlite3
from datetime import datetime

def get_phase(over: int, match_type: str) -> str:
    if match_type == "T20":
        if over < 6:
            return "Powerplay"
        elif over < 15:
            return "Middle"
        else:
            return "Death"
    return "Unknown"

# Resolve absolute paths relative to script location
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
zip_path = os.path.join(base_dir, "data", "raw", "psl_json.zip")
db_path = os.path.join(base_dir, "cricket_ai.db")

print(f"Zip path: {zip_path}")
print(f"DB path: {db_path}")

if not os.path.exists(zip_path):
    raise FileNotFoundError(f"Zip archive not found at: {zip_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ensure tables exist matching the schema defined in app/models
cursor.execute("""
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    short_name VARCHAR(100),
    aliases JSON
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    team VARCHAR(100),
    short_name VARCHAR(100),
    meta JSON
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS team_seasons (
    id INTEGER PRIMARY KEY,
    team_id INTEGER,
    year INTEGER,
    competition VARCHAR(100)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS team_season_players (
    id INTEGER PRIMARY KEY,
    team_season_id INTEGER,
    player_id INTEGER,
    role VARCHAR(50),
    squad_number INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    cricsheet_match_id VARCHAR(100) UNIQUE,
    match_type VARCHAR(50),
    venue VARCHAR(255),
    city VARCHAR(100),
    start_date DATE,
    team_1 VARCHAR(255),
    team_2 VARCHAR(255),
    winner VARCHAR(255),
    team_1_id INTEGER,
    team_2_id INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY,
    match_id INTEGER,
    innings_number INTEGER,
    over_number INTEGER,
    ball_number INTEGER,
    batting_team VARCHAR(255),
    bowling_team VARCHAR(255),
    batter VARCHAR(255),
    bowler VARCHAR(255),
    non_striker VARCHAR(255),
    runs_batter INTEGER,
    runs_extras INTEGER,
    runs_total INTEGER,
    wicket_type VARCHAR(100),
    player_out VARCHAR(255),
    phase VARCHAR(50)
)
""")

conn.commit()

# Parse Zip and load matches
with zipfile.ZipFile(zip_path, "r") as z:
    json_files = sorted([f for f in z.namelist() if f.endswith('.json')])
    print(f"Found {len(json_files)} JSON files in ZIP.")
    
    loaded_count = 0
    for filename in json_files:
        cricsheet_id = filename.replace(".json", "")
        
        # Check if match exists
        cursor.execute("SELECT id FROM matches WHERE cricsheet_match_id = ?", (cricsheet_id,))
        if cursor.fetchone():
            continue
            
        with z.open(filename) as f:
            data = json.load(f)
            
        info = data.get("info", {})
        innings = data.get("innings", [])
        
        match_type = info.get("match_type", "Unknown")
        date_str = info.get("dates", ["2000-01-01"])[0]
        try:
            match_date = datetime.strptime(date_str, "%Y-%m-%d").date().strftime("%Y-%m-%d")
        except Exception:
            match_date = "2000-01-01"
            
        teams = info.get("teams", ["Team 1", "Team 2"])
        team_1 = teams[0]
        team_2 = teams[1] if len(teams) > 1 else "Unknown"
        winner = info.get("outcome", {}).get("winner", "Draw/Tie")
        
        # Ensure Team 1 exists
        cursor.execute("INSERT OR IGNORE INTO teams (name, short_name) VALUES (?, ?)", (team_1, team_1.split()[0]))
        cursor.execute("SELECT id FROM teams WHERE name = ?", (team_1,))
        team_1_id = cursor.fetchone()[0]
        
        # Ensure Team 2 exists
        cursor.execute("INSERT OR IGNORE INTO teams (name, short_name) VALUES (?, ?)", (team_2, team_2.split()[0]))
        cursor.execute("SELECT id FROM teams WHERE name = ?", (team_2,))
        team_2_id = cursor.fetchone()[0]
        
        # Insert Match
        cursor.execute("""
            INSERT INTO matches (cricsheet_match_id, match_type, venue, city, start_date, team_1, team_2, winner, team_1_id, team_2_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (cricsheet_id, match_type, info.get("venue", "Unknown"), info.get("city", "Unknown"), match_date, team_1, team_2, winner, team_1_id, team_2_id))
        match_id = cursor.lastrowid
        
        # Collect players
        players_set = set()
        team_appearances = {team_1: set(), team_2: set()}
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
                            if team_name in team_appearances:
                                team_appearances[team_name].add(p_name)
                                
        # Insert Players
        for p_name in players_set:
            cursor.execute("INSERT OR IGNORE INTO players (name) VALUES (?)", (p_name,))
            
        # Create seasons & rosters
        year = int(date_str.split("-")[0])
        # Team 1 season
        cursor.execute("INSERT OR IGNORE INTO team_seasons (team_id, year) VALUES (?, ?)", (team_1_id, year))
        cursor.execute("SELECT id FROM team_seasons WHERE team_id = ? AND year = ?", (team_1_id, year))
        ts1_id = cursor.fetchone()[0]
        
        # Team 2 season
        cursor.execute("INSERT OR IGNORE INTO team_seasons (team_id, year) VALUES (?, ?)", (team_2_id, year))
        cursor.execute("SELECT id FROM team_seasons WHERE team_id = ? AND year = ?", (team_2_id, year))
        ts2_id = cursor.fetchone()[0]
        
        for team_name, roster in team_appearances.items():
            ts_id = ts1_id if team_name == team_1 else ts2_id
            for p_name in roster:
                cursor.execute("SELECT id FROM players WHERE name = ?", (p_name,))
                player_res = cursor.fetchone()
                if player_res:
                    player_id = player_res[0]
                    cursor.execute("SELECT id FROM team_season_players WHERE team_season_id = ? AND player_id = ?", (ts_id, player_id))
                    if not cursor.fetchone():
                        cursor.execute("INSERT INTO team_season_players (team_season_id, player_id) VALUES (?, ?)", (ts_id, player_id))
                        
        # Insert Deliveries
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
                    
                    deliveries_to_insert.append((
                        match_id, inn_idx + 1, over_num, ball_idx + 1,
                        batting_team, bowling_team, delivery.get("batter"),
                        delivery.get("bowler"), delivery.get("non_striker"), runs.get("batter", 0),
                        runs.get("extras", 0), runs.get("total", 0), wicket_type, player_out, phase
                    ))
                    
        cursor.executemany("""
            INSERT INTO deliveries (match_id, innings_number, over_number, ball_number, batting_team, bowling_team, batter, bowler, non_striker, runs_batter, runs_extras, runs_total, wicket_type, player_out, phase)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, deliveries_to_insert)
        conn.commit()
        loaded_count += 1
        print(f"Loaded {cricsheet_id}: {len(deliveries_to_insert)} deliveries.")

conn.close()
print(f"Seeded successfully: {loaded_count} matches.")
