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

@router.post("/")
async def chat_with_agent(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing from .env file")
        
    try:
        # 1. Connect LangChain to the database we built in V1
        db = SQLDatabase.from_uri(settings.DATABASE_URL)
        
        # 2. Give the Agent a brain (OpenAI GPT-4o-mini is fast and cheap for this)
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        
        # 3. Create the SQL Agent (combining the brain and the database tool)
        agent_executor = create_sql_agent(
            llm=llm, 
            db=db, 
            agent_type="openai-tools", 
            verbose=True
        )
        
        # 4. Ask the agent the user's question
        response = agent_executor.invoke({"input": request.query})
        
        return {"answer": response["output"]}
        
    except Exception as e:
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
