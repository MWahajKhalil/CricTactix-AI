from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List, Optional

class MatchSummary(BaseModel):
    id: int
    cricsheet_id: str
    date: date
    team_1: str
    team_2: str
    winner: Optional[str] = None
    match_type: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    has_scorecard: bool
    player_of_match: Optional[str] = None
    toss_winner: Optional[str] = None
    toss_decision: Optional[str] = None
    win_by_runs: Optional[int] = None
    win_by_wickets: Optional[int] = None
    season: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MatchesResponse(BaseModel):
    count: int
    page: int
    per_page: int
    matches: List[MatchSummary]

class WinnerItem(BaseModel):
    team: str
    wins: int

class TopWinnersResponse(BaseModel):
    top_winners: List[WinnerItem]

class TeamWinPercentage(BaseModel):
    team: str
    played: int
    won: int
    win_percentage: float

class WinPercentagesResponse(BaseModel):
    win_percentages: List[TeamWinPercentage]

class VenueItem(BaseModel):
    venue: str
    matches: int

class TopVenuesResponse(BaseModel):
    top_venues: List[VenueItem]

# Scorecard Pydantic Schemas
class BattingStat(BaseModel):
    player: str
    runs: int
    balls: int
    strike_rate: float

class BowlingStat(BaseModel):
    player: str
    overs: str
    runs_conceded: int
    wickets: int
    economy: float

class FallOfWicketItem(BaseModel):
    wicket_number: int
    score: int
    player: str
    over: str

class InningsSchema(BaseModel):
    innings_number: int
    batting_team: str
    bowling_team: str
    batting: List[BattingStat]
    bowling: List[BowlingStat]
    total_runs: int
    wickets: int
    extras: int
    overs: str
    yet_to_bat: List[str] = []
    fall_of_wickets: List[FallOfWicketItem] = []


class ScorecardSchema(BaseModel):
    innings: List[InningsSchema]

class MatchDetailResponse(BaseModel):
    id: int
    cricsheet_id: str
    date: date
    team_1: str
    team_2: str
    winner: Optional[str] = None
    match_type: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    scorecard: Optional[ScorecardSchema] = None

    player_of_match: Optional[str] = None
    toss_winner: Optional[str] = None
    toss_decision: Optional[str] = None
    win_by_runs: Optional[int] = None
    win_by_wickets: Optional[int] = None
    season: Optional[str] = None
    umpires: Optional[List[str]] = None
    tv_umpire: Optional[str] = None
    match_referee: Optional[str] = None
    match_report: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

