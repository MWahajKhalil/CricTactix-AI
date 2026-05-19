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

export async function getMatches(page = 1, per_page = 12) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/?page=${page}&per_page=${per_page}`, {
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
