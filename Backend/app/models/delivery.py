from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    innings_number = Column(Integer)
    over_number = Column(Integer)
    ball_number = Column(Integer)
    batting_team = Column(String(255))
    bowling_team = Column(String(255))
    batter = Column(String(255))
    bowler = Column(String(255))
    non_striker = Column(String(255))
    runs_batter = Column(Integer)
    runs_extras = Column(Integer)
    runs_total = Column(Integer)
    wicket_type = Column(String(100), nullable=True)
    player_out = Column(String(255), nullable=True)
    phase = Column(String(50), nullable=True)
