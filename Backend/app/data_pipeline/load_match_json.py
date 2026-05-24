import argparse
import json
from datetime import datetime, date
from pathlib import Path
from typing import Any, Dict, Iterable, Optional, Set, Tuple

from app.core.database import Base, SessionLocal, engine
from app.models.delivery import Delivery
from app.models.match import Match
from app.models.player import Player
from app.models.team import Team
from app.models.team_season import TeamSeason
from app.models.team_season_player import TeamSeasonPlayer


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_date(info: Dict[str, Any]) -> date:
    dates = info.get("dates") or []
    if dates:
        try:
            return datetime.strptime(dates[0], "%Y-%m-%d").date()
        except ValueError:
            pass
    return datetime.today().date()


def parse_match_teams(info: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    teams = info.get("teams")
    if isinstance(teams, list) and len(teams) >= 2:
        return teams[0], teams[1]
    return None, None


def parse_runs(runs: Any) -> Tuple[int, int, int]:
    if not isinstance(runs, dict):
        return 0, 0, 0

    batter = int(runs.get("batter") or 0)
    extras_field = runs.get("extras", 0)
    if isinstance(extras_field, dict):
        extras = sum(int(v or 0) for v in extras_field.values() if isinstance(v, int))
    else:
        extras = int(extras_field or 0)

    total = runs.get("total")
    if total is None:
        total = batter + extras
    return batter, extras, int(total)


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


def get_or_create_team_season(session, team_id: int, year: int) -> TeamSeason:
    team_season = (
        session.query(TeamSeason)
        .filter(TeamSeason.team_id == team_id, TeamSeason.year == year)
        .first()
    )
    if team_season:
        return team_season

    team_season = TeamSeason(team_id=team_id, year=year)
    session.add(team_season)
    session.flush()
    return team_season


def get_phase(over_number: int, match_type: str) -> str:
    if match_type == "T20":
        if over_number < 6:
            return "Powerplay"
        if over_number < 15:
            return "Middle"
        return "Death"
    return "Unknown"


def extract_delivery_players(delivery: Dict[str, Any]) -> Set[str]:
    players: Set[str] = set()
    for key in ("batter", "bowler", "non_striker"):
        value = delivery.get(key)
        if value:
            players.add(value)

    wickets = delivery.get("wickets") or []
    if isinstance(wickets, list) and wickets:
        player_out = wickets[0].get("player_out")
        if player_out:
            players.add(player_out)

    return players


def create_match_record(
    session,
    file_id: str,
    team_1: str,
    team_2: str,
    match_type: str,
    start_date: date,
    venue: Optional[str],
    city: Optional[str],
    winner: Optional[str],
    team1_obj: Team,
    team2_obj: Team,
) -> Match:
    match = Match(
        cricsheet_match_id=file_id,
        match_type=match_type,
        venue=venue,
        city=city,
        start_date=start_date,
        team_1=team_1,
        team_2=team_2,
        winner=winner,
        team_1_id=team1_obj.id,
        team_2_id=team2_obj.id,
    )
    session.add(match)
    session.flush()
    return match


def build_delivery_records(
    match_id: int,
    innings_data: Dict[str, Any],
    inning_index: int,
    team_1: str,
    team_2: str,
    match_type: str,
) -> Tuple[list[Delivery], Set[str]]:
    batting_team = innings_data.get("team")
    bowling_team = team_2 if batting_team == team_1 else team_1
    deliveries: list[Delivery] = []
    players_seen: Set[str] = set()

    for over in innings_data.get("overs", []):
        over_number = int(over.get("over", 0))
        phase = get_phase(over_number, match_type)

        for ball_number, delivery in enumerate(over.get("deliveries", []), start=1):
            runs_batter, runs_extras, runs_total = parse_runs(delivery.get("runs", {}))
            players_seen.update(extract_delivery_players(delivery))

            wicket_info = delivery.get("wickets") or []
            wicket_type = None
            player_out = None
            if isinstance(wicket_info, list) and wicket_info:
                wicket_type = wicket_info[0].get("kind")
                player_out = wicket_info[0].get("player_out")

            deliveries.append(
                Delivery(
                    match_id=match_id,
                    innings_number=inning_index + 1,
                    over_number=over_number,
                    ball_number=ball_number,
                    batting_team=batting_team,
                    bowling_team=bowling_team,
                    batter=delivery.get("batter"),
                    bowler=delivery.get("bowler"),
                    non_striker=delivery.get("non_striker"),
                    runs_batter=runs_batter,
                    runs_extras=runs_extras,
                    runs_total=runs_total,
                    wicket_type=wicket_type,
                    player_out=player_out,
                    phase=phase,
                )
            )

    return deliveries, players_seen


def assign_players_to_seasons(
    session,
    player_names: Set[str],
    match_info: Dict[str, Any],
    team_season_1: TeamSeason,
    team_season_2: TeamSeason,
    team_1: str,
    team_2: str,
) -> None:
    roster = match_info.get("players", {}) or {}
    team_1_players = set(roster.get(team_1, []))
    team_2_players = set(roster.get(team_2, []))

    for player_name in player_names:
        player = session.query(Player).filter(Player.name == player_name).first()
        if player is None:
            continue

        if player_name in team_1_players:
            team_season = team_season_1
        elif player_name in team_2_players:
            team_season = team_season_2
        else:
            team_season = team_season_1

        exists = (
            session.query(TeamSeasonPlayer)
            .filter(
                TeamSeasonPlayer.team_season_id == team_season.id,
                TeamSeasonPlayer.player_id == player.id,
            )
            .first()
        )
        if not exists:
            session.add(TeamSeasonPlayer(team_season_id=team_season.id, player_id=player.id))


def load_match_file(session, path: Path) -> bool:
    data = load_json(path)
    file_id = path.stem
    existing_match = session.query(Match).filter(Match.cricsheet_match_id == file_id).first()
    if existing_match:
        print(f"Skipping {file_id}: already loaded")
        return False

    info = data.get("info", {}) or {}
    team_1, team_2 = parse_match_teams(info)
    if not team_1 or not team_2:
        raise ValueError(f"Could not determine teams for {file_id}")

    match_type = info.get("match_type") or info.get("format") or "Unknown"
    start_date = parse_date(info)
    winner = (info.get("outcome") or {}).get("winner") if isinstance(info.get("outcome"), dict) else None

    team1_obj = get_or_create_team(session, team_1)
    team2_obj = get_or_create_team(session, team_2)
    match = create_match_record(
        session,
        file_id=file_id,
        team_1=team_1,
        team_2=team_2,
        match_type=match_type,
        start_date=start_date,
        venue=info.get("venue"),
        city=info.get("city"),
        winner=winner,
        team1_obj=team1_obj,
        team2_obj=team2_obj,
    )

    deliveries: list[Delivery] = []
    all_players: Set[str] = set()
    for inning_index, inning_data in enumerate(data.get("innings", [])):
        inning_deliveries, inning_players = build_delivery_records(
            match.id,
            inning_data,
            inning_index,
            team_1,
            team_2,
            match_type,
        )
        deliveries.extend(inning_deliveries)
        all_players.update(inning_players)

    for player_name in all_players:
        get_or_create_player(session, player_name)

    session.bulk_save_objects(deliveries)
    session.commit()

    year = start_date.year
    team_season_1 = get_or_create_team_season(session, team1_obj.id, year)
    team_season_2 = get_or_create_team_season(session, team2_obj.id, year)
    assign_players_to_seasons(session, all_players, info, team_season_1, team_season_2, team_1, team_2)
    session.commit()

    print(f"Loaded {file_id}: {len(deliveries)} deliveries, {len(all_players)} players.")
    return True


def load_matches(path: Path, limit: int = 0) -> int:
    if not path.exists():
        raise FileNotFoundError(f"Path does not exist: {path}")

    session = SessionLocal()
    loaded_count = 0
    try:
        if path.is_file():
            if load_match_file(session, path):
                loaded_count = 1
        else:
            json_files = sorted(path.glob("*.json"))
            if limit > 0:
                json_files = json_files[:limit]
            for json_file in json_files:
                if load_match_file(session, json_file):
                    loaded_count += 1
    finally:
        session.close()
    return loaded_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Load one or more Cricsheet JSON matches into the database.")
    parser.add_argument("--path", required=True, help="Path to a JSON file or directory containing two-team Cricsheet JSON files")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of files to load from a directory (0 = all)")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    loaded = load_matches(Path(args.path), limit=args.limit)
    print(f"Finished loading {loaded} match(es).")


if __name__ == "__main__":
    main()
