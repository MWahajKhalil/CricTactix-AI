from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class TeamSeasonPlayer(Base):
    __tablename__ = "team_season_players"

    id = Column(Integer, primary_key=True)
    team_season_id = Column(Integer, ForeignKey("team_seasons.id"), index=True)
    player_id = Column(Integer, ForeignKey("players.id"), index=True)
    role = Column(String(50), nullable=True)
    squad_number = Column(Integer, nullable=True)

    team_season = relationship("TeamSeason", back_populates="players")
    player = relationship("Player", back_populates="seasons")
