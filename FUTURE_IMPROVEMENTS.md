# CricTactix AI 🏏 - Future Improvements Roadmap

This document outlines the proposed roadmap for **Version 2** of the CricTactix AI platform, building upon the baseline established in Version 1.

---

## 🌟 Version 2: Visuals, UX, & Data Pipeline

### 1. Interactive AI Chat & UX Enhancements

* **SQL Query & Data Explanations:**
  * **Implementation:** Modify the response format of the chat agent in [chat.py](file:///Users/mwahajkhalil/Learnings/Cricket/Backend/app/api/routes/chat.py) to return both the AI-generated answer and the raw SQL query it executed under the hood.
  * **UX Integration:** Display the SQL query in a collapsable, syntax-highlighted code block in [chat/page.tsx](file:///Users/mwahajkhalil/Learnings/Cricket/frontend/app/chat/page.tsx). This builds high credibility for tactical decisions.
* **Persistent Conversations:**
  * **Implementation:** Add a lightweight SQLite table for chat threads or store history in the browser's `localStorage` to allow users to save, delete, and rename past chat sessions.
* **Analysis Playbooks (Pre-baked Prompt Cards):**
  * **UX Integration:** Expand `suggestedPrompts` in [chat/page.tsx](file:///Users/mwahajkhalil/Learnings/Cricket/frontend/app/chat/page.tsx) with specialized playbook wizards:
    * **Matchup Tool:** *"How does [Batter] perform against [Bowler]?"*
    * **Phase Analysis:** *"Compare run-rate and wicket-loss patterns in Powerplay vs Death overs."*

---

### 2. Rich Visual Analytics

* **Interactive Charts (Recharts / Chart.js):**
  * **Implementation:** Replace the static tables and lists in [dashboard/page.tsx](file:///Users/mwahajkhalil/Learnings/Cricket/frontend/app/dashboard/page.tsx) with interactive charts (e.g., bar charts for top winning teams, pie charts for top venues).
* **Worm Charts & Run-Rate Progressions:**
  * **UX Integration:** On the match details page [[matchId]/page.tsx](file:///Users/mwahajkhalil/Learnings/Cricket/frontend/app/matches/%5BmatchId%5D/page.tsx), add a cumulative runs chart (worm chart) comparing both innings over-by-over.
* **Career Profiles (Team & Player Explorer):**
  * **UX Integration:** Add a dedicated search/browse directory for teams and players, aggregating player career statistics (strike rate, runs, average, wickets, economy) from the [cricket_ai.db](file:///Users/mwahajkhalil/Learnings/Cricket/Backend/cricket_ai.db) deliveries table.

---

### 3. Ingestion & Pipeline Robustness

* **Dynamic File Uploads:**
  * **Implementation:** Add a UI button to upload custom Cricsheet match JSON/zip files, sending them to a backend route that runs [load_cricsheet.py](file:///Users/mwahajkhalil/Learnings/Cricket/Backend/app/data_pipeline/load_cricsheet.py) on the uploaded data.
* **Database Migrations (Alembic Setup):**
  * **Implementation:** Set up `alembic` for proper SQLite migration handling, replacing the current `Base.metadata.create_all()` approach.
* **Ingestion Progress Indicators:**
  * **UX Integration:** Provide real-time progress notifications using WebSockets or Server-Sent Events (SSE) from the `seed-database` endpoint to show upload progress.

---

### 4. True Hybrid RAG (Vector Search + SQL)

* **Implementation:** Store text-based cricket contexts (e.g., player profiles, stadium pitch behaviors, tournament news, and team strategies) in a vector store like ChromaDB.
* **Why:** Modify [chat.py](file:///Users/mwahajkhalil/Learnings/Cricket/Backend/app/api/routes/chat.py) to route queries either to semantic search, SQL querying, or both, giving the analyst contextual knowledge (e.g., *"How has the pitch behaved recently at Gaddafi Stadium?"*).

---

## 🚀 Version 3 & 4 (Future Scope)
* **Predictive Matchups:** Model simulations based on historical delivery matchups.
* **Live Ingestion:** Real-time scorecard ingestion during live matches.
* **Multi-Agent Simulation:** Virtual tactical simulation runs before matches.
