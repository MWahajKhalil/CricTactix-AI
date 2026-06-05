from typing import Optional, cast, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.delivery import Delivery

def calculate_batting_stats(player: str, stats: dict) -> dict:
    """Calculate batting statistics for a player."""
    balls = stats["balls"]
    strike_rate = (stats["runs"] / balls * 100) if balls > 0 else 0.0
    return {
        "player": player,
        "runs": stats["runs"],
        "balls": balls,
        "strike_rate": round(strike_rate, 1),
    }

def calculate_bowling_stats(player: str, stats: dict) -> dict:
    """Calculate bowling statistics for a player."""
    balls = stats["balls"]
    overs = f"{balls // 6}.{balls % 6}" if balls > 0 else "0.0"
    economy = (stats["runs_conceded"] / (balls / 6)) if balls > 0 else 0.0
    return {
        "player": player,
        "overs": overs,
        "runs_conceded": stats["runs_conceded"],
        "wickets": stats["wickets"],
        "economy": round(economy, 2),
    }

def build_scorecard_from_deliveries(deliveries: List[Delivery]) -> List[Dict[str, Any]]:
    """Aggregate deliveries into innings scorecards."""
    innings_map: Dict[int, Dict[str, Any]] = {}
    
    # Aggregate deliveries into innings
    for d in deliveries:
        innings = innings_map.setdefault(cast(int, d.innings_number), {
            "innings_number": d.innings_number,
            "batting_team": d.batting_team,
            "bowling_team": d.bowling_team,
            "batting": {},
            "bowling": {},
            "batting_order": [],
            "bowler_order": [],
            "fall_of_wickets": [],
            "runs": 0,
            "balls": 0,
            "wickets": 0,
            "extras": 0,
        })
        
        innings["runs"] += (d.runs_total or 0)
        innings["extras"] += (d.runs_extras or 0)
        if d.player_out:
            innings["wickets"] += 1
            innings["fall_of_wickets"].append({
                "wicket_number": innings["wickets"],
                "score": innings["runs"],
                "player": d.player_out,
                "over": f"{d.over_number}.{d.ball_number}"
            })
        
        # Track batting stats
        batter = d.batter or "Unknown"
        non_striker = d.non_striker
        
        # Track chronological order of batsman appearance
        batting_order = innings["batting_order"]
        if batter not in batting_order and batter != "Unknown":
            batting_order.append(batter)
        if non_striker and non_striker not in batting_order and non_striker != "Unknown":
            batting_order.append(non_striker)
            
        # Ensure players are initialized in batting dict
        innings["batting"].setdefault(batter, {"runs": 0, "balls": 0})
        if non_striker and non_striker != "Unknown":
            innings["batting"].setdefault(non_striker, {"runs": 0, "balls": 0})
            
        innings["batting"][batter]["runs"] += (d.runs_batter or 0)
        
        # Wides do not count as a ball faced for the batsman
        is_wide = (d.wides or 0) > 0
        is_noball = (d.noballs or 0) > 0
        is_legal_ball = not (is_wide or is_noball)
        
        if not is_wide:
            innings["batting"][batter]["balls"] += 1
            
        # Track bowling stats
        bowler = d.bowler or "Unknown"
        
        # Track chronological order of bowler introduction
        bowler_order = innings["bowler_order"]
        if bowler not in bowler_order and bowler != "Unknown":
            bowler_order.append(bowler)
            
        bowling = innings["bowling"].setdefault(bowler, {"runs_conceded": 0, "balls": 0, "wickets": 0})
        
        # Bowler does not concede runs from field byes and legbyes
        byes = d.byes or 0
        legbyes = d.legbyes or 0
        conceded = (d.runs_total or 0) - byes - legbyes
        bowling["runs_conceded"] += conceded
        
        if is_legal_ball:
            bowling["balls"] += 1
            innings["balls"] += 1
            
        if d.wicket_type in ('bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'):
            bowling["wickets"] += 1
    
    # Format innings data
    innings_list = []
    for innings_number in sorted(innings_map):
        innings = innings_map[innings_number]
        
        # Format batting sorted by chronological entry order
        batting_order = innings.get("batting_order", [])
        def get_batting_index(player_name):
            try:
                return batting_order.index(player_name)
            except ValueError:
                return len(batting_order)
                
        batting_list = [
            calculate_batting_stats(player, innings["batting"][player])
            for player in sorted(innings["batting"].keys(), key=get_batting_index)
        ]
        
        # Format bowling sorted by chronological bowling introduction order
        bowler_order = innings.get("bowler_order", [])
        def get_bowling_index(player_name):
            try:
                return bowler_order.index(player_name)
            except ValueError:
                return len(bowler_order)
                
        bowling_list = [
            calculate_bowling_stats(player, innings["bowling"][player])
            for player in sorted(innings["bowling"].keys(), key=get_bowling_index)
        ]
        
        overs = f"{innings['balls'] // 6}.{innings['balls'] % 6}" if innings["balls"] > 0 else "0.0"
        
        innings_list.append({
            "innings_number": innings["innings_number"],
            "batting_team": innings["batting_team"],
            "bowling_team": innings["bowling_team"],
            "batting": batting_list,
            "bowling": bowling_list,
            "total_runs": innings["runs"],
            "wickets": innings["wickets"],
            "extras": innings["extras"],
            "overs": overs,
            "fall_of_wickets": innings["fall_of_wickets"],
        })
    
    return innings_list


def get_highest_run_scorer(db: Session) -> Optional[Dict[str, Any]]:
    """Return highest run scorer of all matches in the database (cumulative total)."""
    result = (
        db.query(
            Delivery.batter,
            func.sum(Delivery.runs_batter).label("total_runs")
        )
        .group_by(Delivery.batter)
        .order_by(desc("total_runs"))
        .first()
    )
    if not result:
        return None
    return {
        "player": result[0],
        "runs": result[1]
    }

def get_highest_run_scorer_by_player(player: str, db: Session) -> Optional[Dict[str, Any]]:
    """Return highest run scorer of a batsman (personal best in a single match) in the database."""
    result = (
        db.query(
            Delivery.match_id,
            func.sum(Delivery.runs_batter).label("match_runs")
        )
        .filter(Delivery.batter.ilike(f"%{player.strip()}%"))
        .group_by(Delivery.match_id)
        .order_by(desc("match_runs"))
        .first()
    )
    if not result:
        return None
    return {
        "player": player,
        "runs": result[1],
        "match_id": result[0]
    }

def get_highest_wicket_taker(db: Session) -> Optional[Dict[str, Any]]:
    """Return highest wicket taker (leading bowler wickets) of all matches in the database."""
    bowler_wickets = ['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket']
    result = (
        db.query(
            Delivery.bowler,
            func.count(Delivery.id).label("wickets")
        )
        .filter(Delivery.wicket_type.in_(bowler_wickets))
        .group_by(Delivery.bowler)
        .order_by(desc("wickets"))
        .first()
    )
    if not result:
        return None
    return {
        "player": result[0],
        "wickets": result[1]
    }
