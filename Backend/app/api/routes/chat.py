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

For player performance questions such as runs scored or wickets taken, use the `deliveries` table.
For match-level questions such as venue, winner, or teams, use the `matches` table.
When matching names, prefer case-insensitive LIKE patterns for stadiums and player names.
For example, `Gaddafi Stadium` should match both `Gaddafi Stadium` and `Gaddafi Stadium, Lahore`.
If the user asks about a player, the correct table is `deliveries`.
Do not fabricate data; if the database does not contain the answer, say so.

{dialect}
Top {top_k} rows are available from the database.
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
            verbose=True,
        )

        response = agent_executor.invoke({"input": request.query})

        return {"answer": response["output"]}

    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
