const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health/`, {
      // Adding no-store ensures that Next.js Server Components don't cache this aggressively during dev.
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

export async function getMatches() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/`, {
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
