**DB Migrations & Seeding — Notes & Interview Talking Points**

- **What I added**: `app/db_init.py` (dev create + seed), `app/seed_from_json.py` (idempotent importer), updated `requirements.txt`.

- **Why use migrations (Alembic) instead of `create_all()`**:
  - `create_all()` is fine to quickly bootstrap local DBs, but it doesn't record schema versions or handle ALTERs safely.
  - Alembic records migration history, supports autogenerate, and allows safe upgrades/downgrades — important for production and team workflows.

- **Seeding strategy used**:
  - Idempotent upserts: check for existing rows (by unique keys) before inserting. This lets you re-run seeds without duplicating data.
  - Commit per-file when importing many JSON files to make partial progress durable and to limit transaction size.
  - Conservative approach: script currently upserts `Team`, `Player`, and a minimal `Match` entry (uses filename as `cricsheet_match_id`). Deliveries are omitted to keep the import safe and small for demos.

- **Scaling considerations (what to say in an interview)**:
  - For large imports, use bulk insert APIs (`session.bulk_save_objects`, `COPY`, or DB-specific bulk loaders) and disable/enable indexes if supported.
  - Use background workers (Celery/RQ) and checkpoints for long-running imports; write progress markers and resume logic.
  - Normalize vs denormalize tradeoffs: keep canonical `Team`/`Player` tables and store delivery-level data in a separate table for analytics.

- **Testing & repeatability**:
  - Seed scripts should be idempotent and have `--limit` or `--dry-run` flags for safe testing.
  - Add unit tests against an in-memory SQLite DB to validate the parsing and upsert logic.

- **Commands to run (local dev)**:
  - Bootstrap DB + simple seed:
    ```bash
    cd Backend
    source venv/bin/activate
    PYTHONPATH=. python -m app.db_init
    ```

  - Reset the local SQLite schema if it was created with an older model version:
    ```bash
    cd Backend
    source venv/bin/activate
    PYTHONPATH=. python -m app.db_init --drop
    ```

  - Import sample JSON files (safe, idempotent):
    ```bash
    cd Backend
    source venv/bin/activate
    PYTHONPATH=. python -m app.seed_from_json --path ../data/raw/psl_json --limit 10
    ```

  - Load one match with full deliveries and player stats:
    ```bash
    cd Backend
    source venv/bin/activate
    PYTHONPATH=. python -m app.data_pipeline.load_match_json --path data/raw/psl_json/1075986.json
    ```

- **Next steps to mention in interview (optional follow-ups you can implement)**:
  - Add Alembic and create an initial migration.
  - Extend importer to insert `Delivery` rows with batching and error-handling.
  - Add validation and schema tests for edge cases in JSON.

Keep these points short and practice explaining trade-offs (simplicity vs. production safety). If you want, I can add an Alembic scaffold next.
