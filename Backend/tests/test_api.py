import pytest
from datetime import date
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.team import Team

def test_health_check(client):
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "backend"}

def test_get_matches_empty(client):
    response = client.get("/api/matches/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["matches"] == []

def test_get_matches_with_data(client, db_session):
    # Insert mock team
    team_ms = Team(name="Multan Sultans", short_name="Multan")
    team_iu = Team(name="Islamabad United", short_name="Islamabad")
    db_session.add_all([team_ms, team_iu])
    db_session.flush()

    # Insert a mock match
    match = Match(
        cricsheet_match_id="test_match_1",
        match_type="T20",
        venue="Gaddafi Stadium",
        city="Lahore",
        start_date=date(2026, 2, 20),
        team_1="Multan Sultans",
        team_2="Islamabad United",
        winner="Multan Sultans",
        team_1_id=team_ms.id,
        team_2_id=team_iu.id,
    )
    db_session.add(match)
    db_session.flush()

    # Insert mock deliveries
    delivery1 = Delivery(
        match_id=match.id,
        innings_number=1,
        over_number=0,
        ball_number=1,
        batting_team="Multan Sultans",
        bowling_team="Islamabad United",
        batter="Mohammad Rizwan",
        bowler="Shadab Khan",
        runs_batter=4,
        runs_extras=0,
        runs_total=4,
    )
    delivery2 = Delivery(
        match_id=match.id,
        innings_number=1,
        over_number=0,
        ball_number=2,
        batting_team="Multan Sultans",
        bowling_team="Islamabad United",
        batter="Mohammad Rizwan",
        bowler="Shadab Khan",
        runs_batter=0,
        runs_extras=0,
        runs_total=0,
        wicket_type="caught",
        player_out="Mohammad Rizwan",
    )
    delivery3 = Delivery(
        match_id=match.id,
        innings_number=1,
        over_number=0,
        ball_number=3,
        batting_team="Multan Sultans",
        bowling_team="Islamabad United",
        batter="Shan Masood",
        bowler="Shadab Khan",
        runs_batter=0,
        runs_extras=0,
        runs_total=0,
        wicket_type="run out",
        player_out="Shan Masood",
    )
    db_session.add_all([delivery1, delivery2, delivery3])
    db_session.flush()

    # Test listing endpoint
    response = client.get("/api/matches/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["matches"]) == 1
    assert data["matches"][0]["team_1"] == "Multan Sultans"
    assert data["matches"][0]["team_2"] == "Islamabad United"
    assert data["matches"][0]["winner"] == "Multan Sultans"
    assert data["matches"][0]["has_scorecard"] is True

    # Test getting match by ID
    response = client.get(f"/api/matches/{match.id}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["venue"] == "Gaddafi Stadium"
    assert "scorecard" in detail
    assert len(detail["scorecard"]["innings"]) == 1
    
    innings = detail["scorecard"]["innings"][0]
    assert innings["batting_team"] == "Multan Sultans"
    assert innings["total_runs"] == 4
    assert innings["wickets"] == 2
    assert innings["bowling"][0]["player"] == "Shadab Khan"
    assert innings["bowling"][0]["wickets"] == 1
    
    # Test top winners
    response = client.get("/api/matches/stats/top-winners")
    assert response.status_code == 200
    winners_data = response.json()
    assert len(winners_data["top_winners"]) == 1
    assert winners_data["top_winners"][0]["team"] == "Multan Sultans"
    assert winners_data["top_winners"][0]["wins"] == 1

    # Test top venues
    response = client.get("/api/matches/stats/top-venues")
    assert response.status_code == 200
    venues_data = response.json()
    assert len(venues_data["top_venues"]) == 1
    assert venues_data["top_venues"][0]["venue"] == "Gaddafi Stadium"
    assert venues_data["top_venues"][0]["matches"] == 1

    # Test highest run scorer
    response = client.get("/api/matches/stats/highest-run-scorer")
    assert response.status_code == 200
    scorer_data = response.json()
    assert scorer_data["highest_run_scorer"]["player"] == "Mohammad Rizwan"
    assert scorer_data["highest_run_scorer"]["runs"] == 4

    # Test highest wicket taker
    response = client.get("/api/matches/stats/highest-wicket-taker")
    assert response.status_code == 200
    wicket_data = response.json()
    assert wicket_data["highest_wicket_taker"]["player"] == "Shadab Khan"
    assert wicket_data["highest_wicket_taker"]["wickets"] == 1
