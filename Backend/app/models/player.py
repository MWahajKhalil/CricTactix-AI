from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    team = Column(String(100))
    # We can add more fields like batting_style later as we expand
