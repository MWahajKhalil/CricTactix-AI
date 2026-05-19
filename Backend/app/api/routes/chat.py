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
Use only the `matches` table and the available columns: id, cricsheet_match_id, match_type,
venue, city, start_date, team_1, team_2, winner.

When the user asks about a venue or stadium name, prefer broad matching with SQL LIKE
instead of exact equality, because some venues have variants in the database.
For example, `Gaddafi Stadium` should match both `Gaddafi Stadium` and
`Gaddafi Stadium, Lahore`.

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
            verbose=False,
        )

        response = agent_executor.invoke({"input": request.query})

        return {"answer": response["output"]}

    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
