"""Create database tables and seed initial data.

Usage:
    python -m app.db_init
"""
from app.core.database import engine, Base, SessionLocal

# Import all model modules so SQLAlchemy registers mappers and relationships
import app.models.match  # noqa: F401
import app.models.delivery  # noqa: F401
import app.models.player  # noqa: F401
import app.models.team_season  # noqa: F401
import app.models.team_season_player  # noqa: F401
from app.models.team import Team


def create_tables():
    """Create all tables defined on Base metadata."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables defined on Base metadata."""
    Base.metadata.drop_all(bind=engine)


def seed_teams(session):
    """Insert a small set of teams if they don't already exist."""
    default_teams = [
        "Multan Sultans",
        "Islamabad United",
        "Peshawar Zalmi",
        "Lahore Qalandars",
    ]

    for name in default_teams:
        exists = session.query(Team).filter(Team.name == name).first()
        if not exists:
            session.add(Team(name=name, short_name=name.split()[0]))


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Create or reset the database schema and seed initial data.")
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop all existing tables before creating the schema.",
    )
    args = parser.parse_args()

    if args.drop:
        print("Dropping all tables...")
        drop_tables()

    create_tables()
    session = SessionLocal()
    try:
        seed_teams(session)
        session.commit()
        print("Database initialized and seeded (teams).")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
