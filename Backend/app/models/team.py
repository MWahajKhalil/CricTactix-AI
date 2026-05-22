from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    short_name = Column(String(100), nullable=True)
    aliases = Column(JSON, nullable=True)

    seasons = relationship("TeamSeason", back_populates="team")
