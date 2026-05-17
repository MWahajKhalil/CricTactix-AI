from sqlalchemy import Column, Integer, String, Date
from app.core.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    cricsheet_match_id = Column(String(100), unique=True, index=True)
    match_type = Column(String(50))
    venue = Column(String(255))
    city = Column(String(100))
    start_date = Column(Date)
    team_1 = Column(String(255))
    team_2 = Column(String(255))
    winner = Column(String(255))
