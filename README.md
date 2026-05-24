# CricTactix AI 🏏

CricTactix AI is an advanced, AI-powered Cricket Tactical Analyst Platform. It is based on RAG and structured data analytics to provide deep, contextual cricket insights, player comparisons, and matchup intelligence through a natural language interface.

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** FastAPI, PostgreSQL
- **AI & RAG:** LlamaIndex, ChromaDB, OpenAI

**I just started with this project, as of now i just have the backend and the frontend is just a simple chat interface and i want to make a good frontend for this project but with time i will try to add more features.

## Running the backend

1. Activate the backend virtual environment:
```bash
cd Backend
source venv/bin/activate
```

2. Bootstrap the database and seed minimal data:
```bash
PYTHONPATH=. python -m app.db_init
```

If the database schema is stale, reset it with:
```bash
PYTHONPATH=. python -m app.db_init --drop
```

3. Load one Cricsheet match with full deliveries and player stats:
```bash
PYTHONPATH=. python -m app.data_pipeline.load_match_json --path data/raw/psl_json/1075986.json
```

4. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

5. Start the frontend:
```bash
cd ../frontend
npm install
npm run dev
```

