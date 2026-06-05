from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.team import Team  # noqa: F401


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
    
    player_of_match = Column(String(255), nullable=True)
    toss_winner = Column(String(255), nullable=True)
    toss_decision = Column(String(50), nullable=True)
    win_by_runs = Column(Integer, nullable=True, default=0)
    win_by_wickets = Column(Integer, nullable=True, default=0)
    season = Column(String(50), nullable=True)

    # optional canonical team foreign keys (nullable for backward compatibility)
    team_1_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team_2_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    # convenience relationships (won't be populated unless FK set)
    team_1_obj = relationship("Team", foreign_keys=[team_1_id], lazy="joined")
    team_2_obj = relationship("Team", foreign_keys=[team_2_id], lazy="joined")
