import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv, find_dotenv

# LangChain Imports
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import create_sql_agent
from langchain_core.tools import tool

# SQLAlchemy Imports
from sqlalchemy import func, case, desc, extract

# App Core/Model Imports
from app.schemas.chat import ChatRequest
from app.core.config import settings
from app.core.database import SessionLocal

# Import all models to register SQLAlchemy relationships and prevent mapping errors
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.player import Player
from app.models.team import Team
from app.models.team_season import TeamSeason
from app.models.team_season_player import TeamSeasonPlayer

# Helper Imports
from app.core.helpers import normalize_venue_name

# Automatically find .env in parent directories if it's not in the Backend folder
load_dotenv(find_dotenv())

router = APIRouter(
    prefix="/chat",
    tags=["Chat AI"]
)

@tool
def find_players(query: str) -> str:
    """
    Find players in the cricket database using a fuzzy/partial name search.
    Use this tool when you need to find or verify the exact name of a player in the database
    before querying their statistics.
    
    Args:
        query: Part of the player's name (e.g. 'Shaheen', 'Babar', 'Fakhar').
        
    Returns:
        A JSON string containing the list of matching player names and their teams.
    """
    db = SessionLocal()
    try:
        players = db.query(Player).filter(
            (Player.name.ilike(f"%{query}%")) | (Player.short_name.ilike(f"%{query}%"))
        ).limit(15).all()
        
        if not players:
            return f"No players found matching '{query}'"
            
        results = []
        for p in players:
            results.append({
                "name": p.name,
                "short_name": p.short_name,
                "team": p.team
            })
        return json.dumps(results)
    except Exception as e:
        return f"Error finding players: {str(e)}"
    finally:
        db.close()

@tool
def get_player_stats(
    player_name: str,
    venue: Optional[str] = None,
    batting_team: Optional[str] = None,
    bowling_team: Optional[str] = None,
    phase: Optional[str] = None,
    year: Optional[int] = None
) -> str:
    """
    Get aggregated career statistics for a specific player (batting and/or bowling stats) 
    with optional filters like venue, batting team, bowling team, game phase, and year.
    Use this tool whenever a question asks for a player's runs, wickets, strike rate, average, 
    highest score, or other statistics, especially when filters like venue or year are specified.
    
    Args:
        player_name: The exact name of the player (e.g. 'Babar Azam', 'Shaheen Shah Afridi').
        venue: Optional stadium or city filter (e.g. 'Gaddafi Stadium' or 'Lahore').
        batting_team: Optional team batting filter (use this as the player's team for batting stats, or the opponent team for bowling stats).
        bowling_team: Optional team bowling filter (use this as the opponent team for batting stats, or the player's team for bowling stats).
        phase: Optional game phase filter ('Powerplay', 'Middle', 'Death').
        year: Optional calendar year filter (e.g. 2020, 2023).
        
    Returns:
        A JSON string containing batting and bowling statistics under the specified filters.
    """
    db = SessionLocal()
    try:
        # Resolve names to canonical names from the players directory if possible
        db_player = db.query(Player).filter(Player.name.ilike(f"%{player_name}%")).first()
        canonical_name = db_player.name if db_player else player_name
        
        # Set up venue filter helper
        venue_filter = None
        if venue:
            venue_filter = normalize_venue_name(venue)
            
        # Build base queries
        bat_query = db.query(Delivery).join(Match, Delivery.match_id == Match.id).filter(Delivery.batter == canonical_name)
        bowl_query = db.query(Delivery).join(Match, Delivery.match_id == Match.id).filter(Delivery.bowler == canonical_name)
        
        # Apply filters to both queries
        if venue_filter:
            bat_query = bat_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
            bowl_query = bowl_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
        elif venue:
            bat_query = bat_query.filter(Match.venue.ilike(f"%{venue}%"))
            bowl_query = bowl_query.filter(Match.venue.ilike(f"%{venue}%"))
            
        if batting_team:
            bat_query = bat_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            bowl_query = bowl_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            
        if bowling_team:
            bat_query = bat_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            bowl_query = bowl_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            
        if phase:
            bat_query = bat_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            bowl_query = bowl_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            
        if year:
            bat_query = bat_query.filter(extract('year', Match.start_date) == year)
            bowl_query = bowl_query.filter(extract('year', Match.start_date) == year)
            
        # --- Batting Aggregations ---
        is_wide_cond = (Delivery.runs_extras > 0) & (Delivery.runs_batter == 0) & (Delivery.wicket_type.is_(None)) & (Delivery.runs_total > 0)
        balls_faced_case = case((is_wide_cond, 0), else_=1)
        fours_case = case((Delivery.runs_batter == 4, 1), else_=0)
        sixes_case = case((Delivery.runs_batter == 6, 1), else_=0)
        
        bat_row = bat_query.with_entities(
            func.sum(Delivery.runs_batter).label("runs"),
            func.sum(balls_faced_case).label("balls"),
            func.sum(fours_case).label("fours"),
            func.sum(sixes_case).label("sixes"),
            func.count(func.distinct(Delivery.match_id)).label("matches"),
            func.sum(case((Delivery.player_out == canonical_name, 1), else_=0)).label("dismissals")
        ).first()
        
        batting_stats = None
        if bat_row and bat_row.matches and bat_row.matches > 0:
            runs = int(bat_row.runs or 0)
            balls = int(bat_row.balls or 0)
            fours = int(bat_row.fours or 0)
            sixes = int(bat_row.sixes or 0)
            matches = int(bat_row.matches or 0)
            dismissals = int(bat_row.dismissals or 0)
            
            avg = round(runs / dismissals, 2) if dismissals > 0 else None
            sr = round((runs / balls * 100), 2) if balls > 0 else 0.0
            
            # Highest Score under same filters
            hs_query = db.query(
                Delivery.match_id,
                func.sum(Delivery.runs_batter).label("match_runs"),
                func.max(case((Delivery.player_out == canonical_name, 1), else_=0)).label("is_out")
            ).join(Match, Delivery.match_id == Match.id).filter(Delivery.batter == canonical_name)
            
            if venue_filter:
                hs_query = hs_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
            elif venue:
                hs_query = hs_query.filter(Match.venue.ilike(f"%{venue}%"))
            if batting_team:
                hs_query = hs_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            if bowling_team:
                hs_query = hs_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            if phase:
                hs_query = hs_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            if year:
                hs_query = hs_query.filter(extract('year', Match.start_date) == year)
                
            hs_row = hs_query.group_by(Delivery.match_id).order_by(desc("match_runs")).first()
            highest_score = "N/A"
            if hs_row:
                highest_score = f"{hs_row.match_runs}{'' if hs_row.is_out else '*'}"
                
            # 50s and 100s
            scores_query = db.query(
                Delivery.match_id,
                func.sum(Delivery.runs_batter).label("match_runs")
            ).join(Match, Delivery.match_id == Match.id).filter(Delivery.batter == canonical_name)
            
            if venue_filter:
                scores_query = scores_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
            elif venue:
                scores_query = scores_query.filter(Match.venue.ilike(f"%{venue}%"))
            if batting_team:
                scores_query = scores_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            if bowling_team:
                scores_query = scores_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            if phase:
                scores_query = scores_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            if year:
                scores_query = scores_query.filter(extract('year', Match.start_date) == year)
                
            scores_rows = scores_query.group_by(Delivery.match_id).all()
            fifties = sum(1 for r in scores_rows if 50 <= r.match_runs < 100)
            hundreds = sum(1 for r in scores_rows if r.match_runs >= 100)
            
            batting_stats = {
                "matches": matches,
                "innings": len(scores_rows),
                "runs": runs,
                "balls_faced": balls,
                "average": avg if avg is not None else "N/A (Never Out)",
                "strike_rate": sr,
                "fours": fours,
                "sixes": sixes,
                "highest_score": highest_score,
                "fifties": fifties,
                "hundreds": hundreds
            }
            
        # --- Bowling Aggregations ---
        bowler_wickets = ['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket']
        wickets_case = case((Delivery.wicket_type.in_(bowler_wickets), 1), else_=0)
        
        bowl_row = bowl_query.with_entities(
            func.sum(Delivery.runs_total).label("runs_conceded"),
            func.sum(balls_faced_case).label("balls"),
            func.sum(wickets_case).label("wickets"),
            func.count(func.distinct(Delivery.match_id)).label("matches")
        ).first()
        
        bowling_stats = None
        if bowl_row and bowl_row.matches and bowl_row.matches > 0:
            runs_conceded = int(bowl_row.runs_conceded or 0)
            balls = int(bowl_row.balls or 0)
            wickets = int(bowl_row.wickets or 0)
            matches = int(bowl_row.matches or 0)
            
            overs = f"{balls // 6}.{balls % 6}" if balls > 0 else "0.0"
            econ = round((runs_conceded / (balls / 6.0)), 2) if balls > 0 else 0.0
            bowl_avg = round(runs_conceded / wickets, 2) if wickets > 0 else None
            bowl_sr = round(balls / wickets, 2) if wickets > 0 else None
            
            # Best Bowling Figures
            bb_query = db.query(
                Delivery.match_id,
                func.sum(wickets_case).label("match_wickets"),
                func.sum(Delivery.runs_total).label("match_runs_conceded")
            ).join(Match, Delivery.match_id == Match.id).filter(Delivery.bowler == canonical_name)
            
            if venue_filter:
                bb_query = bb_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
            elif venue:
                bb_query = bb_query.filter(Match.venue.ilike(f"%{venue}%"))
            if batting_team:
                bb_query = bb_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            if bowling_team:
                bb_query = bb_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            if phase:
                bb_query = bb_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            if year:
                bb_query = bb_query.filter(extract('year', Match.start_date) == year)
                
            bb_row = bb_query.group_by(Delivery.match_id).order_by(desc("match_wickets"), "match_runs_conceded").first()
            best_bowling = "N/A"
            if bb_row:
                best_bowling = f"{bb_row.match_wickets}/{bb_row.match_runs_conceded}"
                
            # 4w and 5w hauls
            wickets_query = db.query(
                Delivery.match_id,
                func.sum(wickets_case).label("match_wickets")
            ).join(Match, Delivery.match_id == Match.id).filter(Delivery.bowler == canonical_name)
            
            if venue_filter:
                wickets_query = wickets_query.filter(Match.venue.ilike(f"%{venue_filter}%"))
            elif venue:
                wickets_query = wickets_query.filter(Match.venue.ilike(f"%{venue}%"))
            if batting_team:
                wickets_query = wickets_query.filter(Delivery.batting_team.ilike(f"%{batting_team}%"))
            if bowling_team:
                wickets_query = wickets_query.filter(Delivery.bowling_team.ilike(f"%{bowling_team}%"))
            if phase:
                wickets_query = wickets_query.filter(Delivery.phase.ilike(f"%{phase}%"))
            if year:
                wickets_query = wickets_query.filter(extract('year', Match.start_date) == year)
                
            wickets_rows = wickets_query.group_by(Delivery.match_id).all()
            four_wickets = sum(1 for r in wickets_rows if r.match_wickets == 4)
            five_wickets = sum(1 for r in wickets_rows if r.match_wickets >= 5)
            
            bowling_stats = {
                "matches": matches,
                "innings": len(wickets_rows),
                "overs": overs,
                "runs_conceded": runs_conceded,
                "wickets": wickets,
                "economy": econ,
                "average": bowl_avg if bowl_avg is not None else "N/A (No Wickets)",
                "strike_rate": bowl_sr if bowl_sr is not None else "N/A (No Wickets)",
                "best_bowling": best_bowling,
                "four_wickets": four_wickets,
                "five_wickets": five_wickets
            }
            
        if batting_stats is None and bowling_stats is None:
            return f"No statistics found for player '{canonical_name}' under the specified filters."
            
        response_data = {
            "player_name": canonical_name,
            "filters_applied": {
                "venue": venue_filter or venue,
                "batting_team": batting_team,
                "bowling_team": bowling_team,
                "phase": phase,
                "year": year
            },
            "batting": batting_stats,
            "bowling": bowling_stats
        }
        return json.dumps(response_data, indent=2)
        
    except Exception as e:
        return f"Error retrieving player stats: {str(e)}"
    finally:
        db.close()

@tool
def get_matchup_stats(batter_name: str, bowler_name: str) -> str:
    """
    Get head-to-head (matchup) statistics for a specific batsman against a specific bowler.
    Use this tool whenever a question asks about how a batter performs against a bowler, or vice versa
    (e.g., 'How did Babar perform against Shaheen Shah Afridi?', or 'Babar vs Shaheen stats').
    
    Args:
        batter_name: The name of the batsman (e.g. 'Babar Azam').
        bowler_name: The name of the bowler (e.g. 'Shaheen Shah Afridi').
        
    Returns:
        A JSON string containing head-to-head statistics.
    """
    db = SessionLocal()
    try:
        # Resolve names
        db_batter = db.query(Player).filter(Player.name.ilike(f"%{batter_name}%")).first()
        canonical_batter = db_batter.name if db_batter else batter_name
        
        db_bowler = db.query(Player).filter(Player.name.ilike(f"%{bowler_name}%")).first()
        canonical_bowler = db_bowler.name if db_bowler else bowler_name
        
        # Query deliveries faced by batter from bowler
        is_wide_cond = (Delivery.runs_extras > 0) & (Delivery.runs_batter == 0) & (Delivery.wicket_type.is_(None)) & (Delivery.runs_total > 0)
        balls_case = case((is_wide_cond, 0), else_=1)
        bowler_wickets = ['bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket']
        wickets_case = case(((Delivery.wicket_type.in_(bowler_wickets)) & (Delivery.player_out == canonical_batter), 1), else_=0)
        
        fours_case = case((Delivery.runs_batter == 4, 1), else_=0)
        sixes_case = case((Delivery.runs_batter == 6, 1), else_=0)
        dots_case = case(((Delivery.runs_total == 0) & (~is_wide_cond), 1), else_=0)
        
        row = db.query(Delivery).filter(
            Delivery.batter == canonical_batter,
            Delivery.bowler == canonical_bowler
        ).with_entities(
            func.sum(Delivery.runs_batter).label("runs"),
            func.sum(balls_case).label("balls"),
            func.sum(wickets_case).label("wickets"),
            func.count(func.distinct(Delivery.match_id)).label("matches"),
            func.sum(fours_case).label("fours"),
            func.sum(sixes_case).label("sixes"),
            func.sum(dots_case).label("dots")
        ).first()
        
        if not row or not row.matches or row.matches == 0:
            return f"No matchup data found for batter '{canonical_batter}' vs bowler '{canonical_bowler}'."
            
        runs = int(row.runs or 0)
        balls = int(row.balls or 0)
        wickets = int(row.wickets or 0)
        matches = int(row.matches or 0)
        fours = int(row.fours or 0)
        sixes = int(row.sixes or 0)
        dots = int(row.dots or 0)
        
        sr = round((runs / balls * 100), 2) if balls > 0 else 0.0
        avg = round(runs / wickets, 2) if wickets > 0 else None
        
        response_data = {
            "batter_name": canonical_batter,
            "bowler_name": canonical_bowler,
            "matches": matches,
            "runs": runs,
            "balls_faced": balls,
            "wickets": wickets,
            "strike_rate": sr,
            "average": avg if avg is not None else "N/A (Never Dismissed)",
            "fours": fours,
            "sixes": sixes,
            "dot_balls": dots
        }
        return json.dumps(response_data, indent=2)
        
    except Exception as e:
        return f"Error retrieving matchup stats: {str(e)}"
    finally:
        db.close()

@tool
def get_team_stats(
    team_name: str,
    venue: Optional[str] = None,
    year: Optional[int] = None
) -> str:
    """
    Get aggregated match statistics (matches played, won, lost, tied) for a specific team.
    Use this tool whenever a question asks for a team's wins, losses, total matches played, 
    or overall win/loss record, especially when filters like venue or year are specified.
    
    Args:
        team_name: The name or partial name of the team (e.g. 'Karachi Kings', 'Peshawar Zalmi', 'karachi', 'lahore').
        venue: Optional stadium or city filter (e.g. 'Gaddafi Stadium' or 'Lahore').
        year: Optional calendar year filter (e.g. 2020, 2024).
        
    Returns:
        A JSON string containing the team's summary statistics.
    """
    db = SessionLocal()
    try:
        # Resolve team name to canonical name from the database Team table
        db_team = db.query(Team).filter(
            (Team.name.ilike(f"%{team_name}%")) | (Team.short_name.ilike(f"%{team_name}%"))
        ).first()
        canonical_team = db_team.name if db_team else team_name
        
        # Build query for matches played by the team
        query = db.query(Match).filter(
            (Match.team_1 == canonical_team) | (Match.team_2 == canonical_team)
        )
        
        # Apply venue filter if provided
        if venue:
            normalized_v = normalize_venue_name(venue)
            query = query.filter(Match.venue.ilike(f"%{normalized_v}%"))
            
        # Apply year filter if provided
        if year:
            query = query.filter(extract('year', Match.start_date) == year)
            
        matches = query.all()
        played = len(matches)
        won = 0
        lost = 0
        tied = 0
        
        for m in matches:
            if m.winner == canonical_team:
                won += 1
            elif m.winner == "Draw/Tie":
                tied += 1
            else:
                lost += 1
                
        response_data = {
            "team_name": canonical_team,
            "filters_applied": {
                "venue": venue,
                "year": year
            },
            "stats": {
                "played": played,
                "won": won,
                "lost": lost,
                "tied": tied
            }
        }
        return json.dumps(response_data, indent=2)
    except Exception as e:
        return f"Error retrieving team stats: {str(e)}"
    finally:
        db.close()

AGENT_PROMPT_PREFIX = """
You are CricTactix AI, a helpful and premium cricket tactical analyst SQL agent.
Use only the database tables and columns described below, or call the provided custom tools when appropriate.

CRITICAL RULES FOR RETRIEVING CRICKET STATS (YOU MUST FOLLOW THESE):
1. **Prefer Custom Tools**:
   - For player statistics (runs, strike rates, averages, wickets, boundaries, etc.), you MUST call `get_player_stats` instead of writing SQL queries.
   - For head-to-head match-up statistics (e.g., batsman vs bowler), you MUST call `get_matchup_stats` instead of writing SQL queries.
   - For team wins, losses, ties, or total matches played, you MUST call `get_team_stats` instead of writing SQL queries.
   - If you are unsure of the spelling of a player's name (e.g., "Shaheen" or "Fakhar"), first call `find_players` with a partial name query to get the correct name.
   - Only write raw SQL queries for match-level statistics, venue summaries, team standings, or general queries not covered by the custom tools.

2. **Bowler Wickets (If writing raw SQL)**: To calculate the number of wickets taken by a bowler in raw SQL, you MUST count deliveries where `bowler` matches the player's name AND `wicket_type` is one of: 'bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'.
   - DO NOT count run outs, retired hurt, retired out, or obstructing the field as bowler wickets.
   - DO NOT count all deliveries as wickets (do NOT just do COUNT(*)).

3. **Batsman Runs (If writing raw SQL)**: To calculate runs scored by a batsman in raw SQL, SUM the `runs_batter` column where `batter` matches the player's name.

4. **Name Matching (If writing raw SQL)**: ALWAYS use case-insensitive `LIKE` patterns (e.g. `LIKE '%Shaheen%'`) when querying players, stadiums, or teams.

Available database tables (for when you do write raw SQL queries):
- matches(id, cricsheet_match_id, match_type, venue, city, start_date, team_1, team_2, winner, team_1_id, team_2_id)
- deliveries(match_id, innings_number, over_number, ball_number, batting_team, bowling_team, batter, bowler, non_striker, runs_batter, runs_extras, runs_total, wicket_type, player_out, phase)
- players(id, name, team, short_name, meta)
- teams(id, name, short_name, aliases)

Do not fabricate data; if the tools or database do not contain the answer, say so.

{dialect}
Top {top_k} rows are available from the database.
"""

AGENT_SUFFIX = """
CRITICAL RULES FOR CALCULATING CRICKET STATS (YOU MUST OBEY THESE):
1. **Prefer Custom Tools**: For player statistics, matchups, or team win/loss records, you MUST call `get_player_stats`, `get_matchup_stats`, `get_team_stats`, or `find_players` instead of writing raw SQL queries.
2. **Bowler Wickets (If writing raw SQL)**: Count deliveries where bowler matches AND wicket_type is one of: 'bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'. Do not count run outs/retired outs.
3. **Batsman Runs (If writing raw SQL)**: SUM the `runs_batter` column.
4. **Name Matching (If writing raw SQL)**: ALWAYS use case-insensitive `LIKE` patterns.

Begin!

Question: {input}
{agent_scratchpad}
"""

@router.post("/")
async def chat_with_agent(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing from .env file")

    try:
        db = SQLDatabase.from_uri(settings.DATABASE_URL)
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

        # Register custom tools to supplement database SQL access
        extra_tools = [find_players, get_player_stats, get_matchup_stats, get_team_stats]

        agent_executor = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",
            prefix=AGENT_PROMPT_PREFIX,
            suffix=AGENT_SUFFIX,
            verbose=True,
            extra_tools=extra_tools
        )

        response = agent_executor.invoke({"input": request.query})

        return {"answer": response["output"]}

    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


