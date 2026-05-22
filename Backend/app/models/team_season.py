from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class TeamSeason(Base):
    __tablename__ = "team_seasons"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    year = Column(Integer, index=True)
    competition = Column(String(100), nullable=True)

    team = relationship("Team", back_populates="seasons")
    players = relationship("TeamSeasonPlayer", back_populates="team_season")
