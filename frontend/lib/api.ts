// Base URL for the API. This can be configured with NEXT_PUBLIC_API_URL in the frontend environment.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed with status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error connecting to backend:", error);
    throw error;
  }
}

type MatchFilters = {
  team?: string;
  winner?: string;
  match_type?: string;
  year?: string;
  venue?: string;
  venue_fuzzy?: boolean;
};

export async function getMatches(page = 1, per_page = 12, filters: MatchFilters = {}) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(per_page),
    });

    if (filters.team) params.set("team", filters.team);
    if (filters.winner) params.set("winner", filters.winner);
    if (filters.match_type) params.set("match_type", filters.match_type);
    if (filters.year) params.set("year", filters.year);
    if (filters.venue) params.set("venue", filters.venue);
    if (filters.venue_fuzzy) params.set("venue_fuzzy", "true");

    const response = await fetch(`${API_BASE_URL}/api/matches/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { count: 0, matches: [] };
  }
}

export async function getTopWinners(limit = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/stats/top-winners?limit=${limit}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top winners: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching top winners:", error);
    return { top_winners: [] };
  }
}

export async function getMatchById(matchId: string | number) {
  const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load match with id ${matchId}: ${response.status}`);
  }

  return response.json();
}

export async function sendChatMessage(query: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to get response: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
}
