"""Seed the database from Cricsheet JSON files.

Usage:
    python -m app.seed_from_json --path ../data/raw/psl_json --limit 10

This script:
 - finds or creates teams
 - finds or creates players
 - creates a minimal match record per file

It is intentionally simple so you can explain it clearly in an interview.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Set, Tuple

from app.core.database import SessionLocal
from app.models.match import Match
from app.models.player import Player
from app.models.team import Team


def load_json_file(path: Path) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def get_existing_match(session, file_id: str) -> Optional[Match]:
    return session.query(Match).filter(Match.cricsheet_match_id == file_id).first()


def find_team_names(info: Dict[str, Any], data: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    teams = info.get("teams")
    if isinstance(teams, list) and len(teams) >= 2:
        return teams[0], teams[1]

    # fallback: search innings data for a team list
    innings = data.get("innings", [])
    for inning in innings:
        if isinstance(inning, dict):
            for inning_data in inning.values():
                if isinstance(inning_data, dict):
                    team_name = inning_data.get("team")
                    if team_name:
                        if not teams:
                            teams = [team_name]
                        elif team_name != teams[0]:
                            return teams[0], team_name

    return None, None


def find_player_names(data: Dict[str, Any]) -> Set[str]:
    players: Set[str] = set()
    for inning in data.get("innings", []):
        for inning_data in inning.values():
            for delivery in inning_data.get("deliveries", []):
                for event in delivery.values():
                    for key in ("batter", "bowler", "non_striker"):
                        value = event.get(key)
                        if value:
                            players.add(value)
                    wickets = event.get("wickets") or []
                    if isinstance(wickets, list) and wickets:
                        player_out = wickets[0].get("player_out")
                        if player_out:
                            players.add(player_out)
    return players


def get_or_create_team(session, name: Optional[str]) -> Optional[Team]:
    if not name:
        return None

    team = session.query(Team).filter(Team.name == name).first()
    if team:
        return team

    team = Team(name=name, short_name=name.split()[0])
    session.add(team)
    session.flush()
    return team


def get_or_create_player(session, name: str) -> Player:
    player = session.query(Player).filter(Player.name == name).first()
    if player:
        return player

    player = Player(name=name)
    session.add(player)
    session.flush()
    return player


def create_minimal_match(
    session,
    file_id: str,
    team_1: Optional[str],
    team_2: Optional[str],
    info: Dict[str, Any],
    team_1_obj: Optional[Team],
    team_2_obj: Optional[Team],
) -> Match:
    match = Match(
        cricsheet_match_id=file_id,
        team_1=team_1,
        team_2=team_2,
        match_type=info.get("match_type") or info.get("format"),
        venue=info.get("venue"),
        city=info.get("city"),
        winner=(info.get("outcome") or {}).get("winner") if isinstance(info.get("outcome"), dict) else None,
        team_1_id=team_1_obj.id if team_1_obj else None,
        team_2_id=team_2_obj.id if team_2_obj else None,
    )
    session.add(match)
    session.flush()
    return match


def import_file(session, path: Path) -> bool:
    data = load_json_file(path)
    file_id = path.stem

    if get_existing_match(session, file_id):
        print(f"Skipping {file_id}: already loaded")
        return False

    info = data.get("info", {}) or {}
    team_1, team_2 = find_team_names(info, data)
    if not team_1 or not team_2:
        raise ValueError(f"Could not determine teams for {file_id}")

    team_1_obj = get_or_create_team(session, team_1)
    team_2_obj = get_or_create_team(session, team_2)
    player_names = find_player_names(data)

    for player_name in player_names:
        get_or_create_player(session, player_name)

    create_minimal_match(session, file_id, team_1, team_2, info, team_1_obj, team_2_obj)
    return True


def load_files(path: Path, limit: int = 0) -> int:
    files = sorted(path.glob("*.json")) if path.is_dir() else [path]
    if limit > 0:
        files = files[:limit]

    session = SessionLocal()
    imported = 0
    try:
        for json_file in files:
            if import_file(session, json_file):
                session.commit()
                imported += 1
            else:
                session.rollback()
    finally:
        session.close()

    return imported


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Cricsheet matches into the database.")
    parser.add_argument("--path", required=True, help="Path to a JSON file or directory")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of files to import")
    args = parser.parse_args()

    path = Path(args.path)
    if not path.exists():
        raise FileNotFoundError(f"Path does not exist: {path}")

    imported = load_files(path, limit=args.limit)
    print(f"Imported {imported} files (teams/players/matches).")


if __name__ == "__main__":
    main()
