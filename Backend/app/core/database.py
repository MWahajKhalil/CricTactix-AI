""" This file sets up the database connection using SQLAlchemy. It creates an engine based on the database URL specified in the settings, and defines a session factory (SessionLocal) for creating database sessions. The Base class is defined for declarative models, and a get_db function is provided to yield a database session for use in API routes, ensuring that the session is properly closed after use.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLite needs check_same_thread=False
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
