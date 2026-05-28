from typing import Optional

TEAM_ALIAS_MAP = {
    "lahore": ["Lahore Qalandars"],
    "lahore qalandars": ["Lahore Qalandars"],
    "karachi": ["Karachi Kings"],
    "karachi kings": ["Karachi Kings"],
    "hyderabad": ["Hyderabad Kingsmen"],
    "hyderabad kingsmen": ["Hyderabad Kingsmen"],
    "islamabad": ["Islamabad United"],
    "islamabad united": ["Islamabad United"],
    "peshawar": ["Peshawar Zalmi"],
    "peshawar zalmi": ["Peshawar Zalmi"],
    "quetta": ["Quetta Gladiators"],
    "quetta gladiators": ["Quetta Gladiators"],
    "multan": ["Multan Sultans"],
    "multan sultans": ["Multan Sultans"],
    "rawalpindi": ["Rawalpindiz"],
    "rawalpindiz": ["Rawalpindiz"],
}

VENUE_ALIAS_MAP = {
    "gaddafi": ["Gaddafi Stadium", "Gaddafi Stadium, Lahore"],
    "gaddafi stadium": ["Gaddafi Stadium", "Gaddafi Stadium, Lahore"],
    "national": ["National Stadium", "National Stadium, Karachi"],
    "national stadium": ["National Stadium", "National Stadium, Karachi"],
    "multan": ["Multan Cricket Stadium"],
    "rawalpindi": ["Rawalpindi Cricket Stadium"],
    "rawalpindi cricket": ["Rawalpindi Cricket Stadium"],
    "sharjah": ["Sharjah Cricket Stadium"],
    "sheikh zayed": ["Sheikh Zayed Stadium", "Sheikh Zayed Stadium, Abu Dhabi"],
    "dubai": ["Dubai International Cricket Stadium"],
    "dubai international": ["Dubai International Cricket Stadium"],
    "abu dhabi": ["Sheikh Zayed Stadium", "Sheikh Zayed Stadium, Abu Dhabi"],
}

def normalize_alias_key(value: Optional[str]) -> str:
    return value.strip().lower() if value and value.strip() else ""

def alias_values_for_term(value: Optional[str], alias_map: dict[str, list[str]]) -> list[str]:
    normalized = normalize_alias_key(value)
    return alias_map.get(normalized, [])
