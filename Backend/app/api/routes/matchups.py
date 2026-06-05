from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.models.delivery import Delivery
from app.models.player import Player

# LangChain / OpenAI Imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

router = APIRouter(
    prefix="/matchups",
    tags=["Matchups"],
)

@router.get("/players")
def get_matchup_players(db: Session = Depends(get_db)):
    """
    Get a list of all distinct batters and bowlers present in the delivery records
    to populate the frontend autocompletes.
    """
    try:
        # Get distinct batters
        batters = [
            row[0] for row in db.query(Delivery.batter)
            .filter(Delivery.batter != None, Delivery.batter != "")
            .distinct()
            .order_by(Delivery.batter)
            .all()
        ]
        
        # Get distinct bowlers
        bowlers = [
            row[0] for row in db.query(Delivery.bowler)
            .filter(Delivery.bowler != None, Delivery.bowler != "")
            .distinct()
            .order_by(Delivery.bowler)
            .all()
        ]
        
        return {
            "batters": batters,
            "bowlers": bowlers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch players: {str(e)}")


@router.get("/analyze")
def analyze_matchup(
    batter: str = Query(..., description="Exact name of the batter"),
    bowler: str = Query(..., description="Exact name of the bowler"),
    db: Session = Depends(get_db)
):
    """
    Run detailed SQLite database aggregations for the head-to-head duel
    and career baselines, and call GPT-4o-mini to write a tactical coaching briefing.
    """
    try:
        # Check if players exist in the delivery records
        batter_exists = db.query(Delivery.id).filter(Delivery.batter == batter).first()
        bowler_exists = db.query(Delivery.id).filter(Delivery.bowler == bowler).first()
        
        if not batter_exists:
            raise HTTPException(status_code=404, detail=f"Batter '{batter}' has no delivery records.")
        if not bowler_exists:
            raise HTTPException(status_code=404, detail=f"Bowler '{bowler}' has no delivery records.")

        # ==========================================
        # 1. HEAD-TO-HEAD ANALYSIS
        # ==========================================
        h2h_deliveries = db.query(Delivery).filter(
            Delivery.batter == batter,
            Delivery.bowler == bowler
        ).all()
        
        h2h_runs = 0
        h2h_balls = 0
        h2h_dismissals = 0
        h2h_dot_balls = 0
        h2h_fours = 0
        h2h_sixes = 0
        
        for d in h2h_deliveries:
            is_wide = (d.wides or 0) > 0
            if not is_wide:
                h2h_balls += 1
            
            h2h_runs += (d.runs_batter or 0)
            
            # Bowler dismissals of the batter
            if d.wicket_type and d.player_out == batter:
                is_bowler_wicket = d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
                if is_bowler_wicket:
                    h2h_dismissals += 1
            
            # Dot ball: legal ball with 0 batter runs
            if (d.runs_batter or 0) == 0 and (d.wides or 0) == 0 and (d.noballs or 0) == 0:
                h2h_dot_balls += 1
                
            if (d.runs_batter or 0) == 4:
                h2h_fours += 1
            elif (d.runs_batter or 0) == 6:
                h2h_sixes += 1
                
        h2h_strike_rate = (h2h_runs / h2h_balls * 100) if h2h_balls > 0 else 0.0
        h2h_dot_ball_pct = (h2h_dot_balls / h2h_balls * 100) if h2h_balls > 0 else 0.0

        # ==========================================
        # 2. BATTER CAREER BASELINE
        # ==========================================
        batter_deliveries = db.query(Delivery).filter(Delivery.batter == batter).all()
        
        b_runs = 0
        b_balls = 0
        b_dismissals = 0
        b_dot_balls = 0
        b_fours = 0
        b_sixes = 0
        
        for d in batter_deliveries:
            is_wide = (d.wides or 0) > 0
            if not is_wide:
                b_balls += 1
            
            b_runs += (d.runs_batter or 0)
            
            if d.wicket_type and d.player_out == batter:
                is_bowler_wicket = d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
                if is_bowler_wicket:
                    b_dismissals += 1
                    
            if (d.runs_batter or 0) == 0 and (d.wides or 0) == 0 and (d.noballs or 0) == 0:
                b_dot_balls += 1
                
            if (d.runs_batter or 0) == 4:
                b_fours += 1
            elif (d.runs_batter or 0) == 6:
                b_sixes += 1
                
        b_strike_rate = (b_runs / b_balls * 100) if b_balls > 0 else 0.0
        b_dot_ball_pct = (b_dot_balls / b_balls * 100) if b_balls > 0 else 0.0
        b_average = (b_runs / b_dismissals) if b_dismissals > 0 else b_runs

        # ==========================================
        # 3. BOWLER CAREER BASELINE
        # ==========================================
        bowler_deliveries = db.query(Delivery).filter(Delivery.bowler == bowler).all()
        
        bo_runs = 0
        bo_balls = 0
        bo_wickets = 0
        bo_dot_balls = 0
        bo_fours = 0
        bo_sixes = 0
        
        for d in bowler_deliveries:
            is_extra_ball = (d.wides or 0) > 0 or (d.noballs or 0) > 0
            if not is_extra_ball:
                bo_balls += 1
            
            # Bowler runs: runs batter + wides + noballs (excludes byes/legbyes)
            runs_conceded = (d.runs_batter or 0) + (d.wides or 0) + (d.noballs or 0)
            bo_runs += runs_conceded
            
            if d.wicket_type:
                is_bowler_wicket = d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
                if is_bowler_wicket:
                    bo_wickets += 1
            
            if runs_conceded == 0:
                bo_dot_balls += 1
                
            if (d.runs_batter or 0) == 4:
                bo_fours += 1
            elif (d.runs_batter or 0) == 6:
                bo_sixes += 1
                
        bo_economy = (bo_runs / (bo_balls / 6)) if bo_balls > 0 else 0.0
        bo_strike_rate = (bo_balls / bo_wickets) if bo_wickets > 0 else 0.0
        bo_dot_ball_pct = (bo_dot_balls / len(bowler_deliveries) * 100) if len(bowler_deliveries) > 0 else 0.0

        # ==========================================
        # 4. MATCH PHASE BREAKDOWN (Powerplay, Middle, Death)
        # ==========================================
        phases = ["Powerplay", "Middle", "Death"]
        h2h_phases = {}
        batter_phases = {}
        bowler_phases = {}
        
        for phase in phases:
            # Head-to-Head Phase
            p_h2h = [d for d in h2h_deliveries if d.phase == phase]
            p_h2h_runs = sum(d.runs_batter or 0 for d in p_h2h)
            p_h2h_balls = sum(1 for d in p_h2h if (d.wides or 0) == 0)
            p_h2h_dismissals = sum(
                1 for d in p_h2h if d.wicket_type and d.player_out == batter and 
                d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
            )
            h2h_phases[phase] = {
                "runs": p_h2h_runs,
                "balls": p_h2h_balls,
                "dismissals": p_h2h_dismissals,
                "strike_rate": (p_h2h_runs / p_h2h_balls * 100) if p_h2h_balls > 0 else 0.0
            }
            
            # Batter Phase Baseline
            p_bat = [d for d in batter_deliveries if d.phase == phase]
            p_bat_runs = sum(d.runs_batter or 0 for d in p_bat)
            p_bat_balls = sum(1 for d in p_bat if (d.wides or 0) == 0)
            p_bat_dismissals = sum(
                1 for d in p_bat if d.wicket_type and d.player_out == batter and 
                d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
            )
            batter_phases[phase] = {
                "runs": p_bat_runs,
                "balls": p_bat_balls,
                "dismissals": p_bat_dismissals,
                "strike_rate": (p_bat_runs / p_bat_balls * 100) if p_bat_balls > 0 else 0.0
            }
            
            # Bowler Phase Baseline
            p_bowl = [d for d in bowler_deliveries if d.phase == phase]
            p_bowl_runs = sum((d.runs_batter or 0) + (d.wides or 0) + (d.noballs or 0) for d in p_bowl)
            p_bowl_balls = sum(1 for d in p_bowl if (d.wides or 0) == 0 and (d.noballs or 0) == 0)
            p_bowl_wickets = sum(
                1 for d in p_bowl if d.wicket_type and 
                d.wicket_type.lower() not in ["run out", "retired hurt", "obstructing the field"]
            )
            bowler_phases[phase] = {
                "runs_conceded": p_bowl_runs,
                "balls": p_bowl_balls,
                "wickets": p_bowl_wickets,
                "economy": (p_bowl_runs / (p_bowl_balls / 6)) if p_bowl_balls > 0 else 0.0
            }

        # ==========================================
        # 5. LLM TACTICAL COMMENTARY
        # ==========================================
        system_msg = SystemMessage(content="""You are an elite cricket tactical analyst working for a professional franchise team (similar to Cricviz). 
Your task is to analyze the provided Matchup statistics between a batter and a bowler and write a short, highly professional, data-backed tactical briefing.
Use bullet points for clarity. Structure your response with these headings:
1. MATCHUP SUMMARY: 2-3 sentences outlining the historical dominance or status of the duel.
2. BOWLER TACTICS: Specific instructions on how the bowler should target the batter (line, length, match phase, setting traps).
3. BATTER TACTICS: Instructions on how the batter should play this bowler (scoring areas, risk mitigation, footwork/intent).
4. TACTICAL RECOMMENDATION: Clear coaching summary on when/where this matchup should be deployed.
Keep your analysis concise, professional, and directly referenced to the statistics provided. Avoid generic fluff.""")

        b_avg_str = f"{b_average:.1f}" if b_dismissals > 0 else "N/A"
        bo_sr_str = f"{bo_strike_rate:.1f}" if bo_strike_rate > 0 else "N/A"

        stats_summary = f"""
Matchup Analysis: Batter {batter} vs Bowler {bowler}

--- HEAD-TO-HEAD DUEL ---
- Deliveries faced: {h2h_balls}
- Runs scored: {h2h_runs}
- Dismissals: {h2h_dismissals}
- Strike Rate: {h2h_strike_rate:.1f}
- Dot ball %: {h2h_dot_ball_pct:.1f}
- Fours: {h2h_fours}, Sixes: {h2h_sixes}

--- BATTER CAREER BASELINE ---
- Overall Runs: {b_runs}
- Overall Balls: {b_balls}
- Overall Strike Rate: {b_strike_rate:.1f}
- Overall Average: {b_avg_str}
- Overall Dot ball %: {b_dot_ball_pct:.1f}
- Fours: {b_fours}, Sixes: {b_sixes}

--- BOWLER CAREER BASELINE ---
- Overall Runs Conceded: {bo_runs}
- Overall Balls Bowled: {bo_balls}
- Overall Economy: {bo_economy:.2f}
- Overall Wickets: {bo_wickets}
- Overall Strike Rate: {bo_sr_str}
- Overall Dot ball %: {bo_dot_ball_pct:.1f}

--- PHASE SPLITS (Powerplay / Middle / Death) ---
Head-To-Head Splits:
- Powerplay: {h2h_phases['Powerplay']['runs']} runs off {h2h_phases['Powerplay']['balls']} balls, {h2h_phases['Powerplay']['dismissals']} dismissals
- Middle: {h2h_phases['Middle']['runs']} runs off {h2h_phases['Middle']['balls']} balls, {h2h_phases['Middle']['dismissals']} dismissals
- Death: {h2h_phases['Death']['runs']} runs off {h2h_phases['Death']['balls']} balls, {h2h_phases['Death']['dismissals']} dismissals

Batter Overall Splits:
- Powerplay: {batter_phases['Powerplay']['runs']} runs off {batter_phases['Powerplay']['balls']} balls, {batter_phases['Powerplay']['dismissals']} dismissals
- Middle: {batter_phases['Middle']['runs']} runs off {batter_phases['Middle']['balls']} balls, {batter_phases['Middle']['dismissals']} dismissals
- Death: {batter_phases['Death']['runs']} runs off {batter_phases['Death']['balls']} balls, {batter_phases['Death']['dismissals']} dismissals

Bowler Overall Splits:
- Powerplay: {bowler_phases['Powerplay']['runs_conceded']} runs conceded off {bowler_phases['Powerplay']['balls']} balls, {bowler_phases['Powerplay']['wickets']} wickets
- Middle: {bowler_phases['Middle']['runs_conceded']} runs conceded off {bowler_phases['Middle']['balls']} balls, {bowler_phases['Middle']['wickets']} wickets
- Death: {bowler_phases['Death']['runs_conceded']} runs conceded off {bowler_phases['Death']['balls']} balls, {bowler_phases['Death']['wickets']} wickets
"""

        commentary = "Failed to generate AI tactical report."
        try:
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
            response = llm.invoke([system_msg, HumanMessage(content=stats_summary)])
            commentary = response.content
        except Exception as ai_err:
            commentary = f"AI Commentary Engine Offline. Stats are computed. Error detail: {str(ai_err)}"

        return {
            "batter": batter,
            "bowler": bowler,
            "h2h": {
                "runs": h2h_runs,
                "balls": h2h_balls,
                "dismissals": h2h_dismissals,
                "strike_rate": h2h_strike_rate,
                "dot_ball_pct": h2h_dot_ball_pct,
                "fours": h2h_fours,
                "sixes": h2h_sixes
            },
            "batter_baseline": {
                "runs": b_runs,
                "balls": b_balls,
                "dismissals": b_dismissals,
                "strike_rate": b_strike_rate,
                "dot_ball_pct": b_dot_ball_pct,
                "average": b_average,
                "fours": b_fours,
                "sixes": b_sixes
            },
            "bowler_baseline": {
                "runs_conceded": bo_runs,
                "balls": bo_balls,
                "wickets": bo_wickets,
                "economy": bo_economy,
                "strike_rate": bo_strike_rate,
                "dot_ball_pct": bo_dot_ball_pct,
                "fours": bo_fours,
                "sixes": bo_sixes
            },
            "splits": {
                "h2h": h2h_phases,
                "batter": batter_phases,
                "bowler": bowler_phases
            },
            "commentary": commentary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matchup analysis failed: {str(e)}")
