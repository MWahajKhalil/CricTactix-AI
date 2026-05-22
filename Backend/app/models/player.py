from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    team = Column(String(100))
    short_name = Column(String(100), nullable=True)
    meta = Column(JSON, nullable=True)

    # seasons: TeamSeasonPlayer backref
    seasons = relationship("TeamSeasonPlayer", back_populates="player")
