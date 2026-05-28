import os
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv, find_dotenv

# LangChain Imports
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import create_sql_agent

from app.schemas.chat import ChatRequest
from app.core.config import settings

# Automatically find .env in parent directories if it's not in the Backend folder
load_dotenv(find_dotenv())

router = APIRouter(
    prefix="/chat",
    tags=["Chat AI"]
)

AGENT_PROMPT_PREFIX = """
You are a helpful cricket analytics SQL agent.
Use only the database tables and columns described below.

Available tables:
- matches(id, cricsheet_match_id, match_type, venue, city, start_date, team_1, team_2, winner, team_1_id, team_2_id)
- deliveries(match_id, innings_number, over_number, ball_number, batting_team, bowling_team, batter, bowler, non_striker, runs_batter, runs_extras, runs_total, wicket_type, player_out, phase)
- players(id, name, team, short_name, meta)
- teams(id, name, short_name, aliases)

CRITICAL RULES FOR CALCULATING CRICKET STATS:
1. **Bowler Wickets**: To calculate the number of wickets taken by a bowler, you MUST count deliveries where `bowler` matches the player's name AND `wicket_type` is one of: 'bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'.
   - DO NOT count all deliveries as wickets (e.g. do not just do COUNT(*)).
   - DO NOT count run outs, retired hurt, retired out, or obstructing the field as bowler wickets.
   - Example query: `SELECT COUNT(*) FROM deliveries WHERE bowler LIKE '%Shaheen Shah Afridi%' AND wicket_type IN ('bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket')`
2. **Batsman Runs**: To calculate runs scored by a batsman, SUM the `runs_batter` column where `batter` matches the player's name.
   - Example query: `SELECT SUM(runs_batter) FROM deliveries WHERE batter LIKE '%Babar Azam%'`
3. **Name Matching**: Player names and stadiums in the database might have variations (e.g. "Shaheen Shah Afridi" vs "Shaheen Afridi" or "Gaddafi Stadium" vs "Gaddafi Stadium, Lahore"). ALWAYS use case-insensitive `LIKE` patterns (e.g. `LIKE '%Shaheen%'` or `LIKE '%Gaddafi%'`) when querying players, stadiums, or teams.

For player performance questions such as runs scored or wickets taken, use the `deliveries` table.
For match-level questions such as venue, winner, or teams, use the `matches` table.
Do not fabricate data; if the database does not contain the answer, say so.

{dialect}
Top {top_k} rows are available from the database.
"""

AGENT_SUFFIX = """
CRITICAL RULES FOR CALCULATING CRICKET STATS (YOU MUST OBEY THESE):
1. **Bowler Wickets**: To calculate the number of wickets taken by a bowler, you MUST count deliveries where `bowler` matches the player's name AND `wicket_type` is one of: 'bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket'.
   - DO NOT count all deliveries as wickets (do NOT just do COUNT(*)).
   - DO NOT count run outs, retired hurt, retired out, or obstructing the field as bowler wickets.
   - Example query: `SELECT COUNT(*) FROM deliveries WHERE bowler LIKE '%Shaheen Shah Afridi%' AND wicket_type IN ('bowled', 'caught', 'caught and bowled', 'lbw', 'stumped', 'hit wicket')`
2. **Batsman Runs**: To calculate runs scored by a batsman, SUM the `runs_batter` column where `batter` matches the player's name.
   - Example query: `SELECT SUM(runs_batter) FROM deliveries WHERE batter LIKE '%Babar Azam%'`
3. **Name Matching**: ALWAYS use case-insensitive `LIKE` patterns (e.g. `LIKE '%Shaheen%'`) when querying players, stadiums, or teams.

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

        agent_executor = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",
            prefix=AGENT_PROMPT_PREFIX,
            suffix=AGENT_SUFFIX,
            verbose=True,
        )

        response = agent_executor.invoke({"input": request.query})

        return {"answer": response["output"]}

    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
