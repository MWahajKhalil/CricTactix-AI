// this lines define the base URL for the API, which can be set via an environment variable or defaults to localhost. enviroment variables in Next.js that start with NEXT_PUBLIC_ are exposed to the browser, making them accessible in client-side code. This allows you to configure the API endpoint without hardcoding it, which is especially useful for different environments (development, staging, production).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";  

// This function checks the health of the backend by making a GET request to the /api/health/ endpoint. It uses the fetch API to perform the request and includes error handling to catch any issues that may arise during the connection. If the response is not successful (i.e., status code is not in the 200-299 range), it throws an error with the status code. If there is an error during the fetch operation, it logs the error to the console and rethrows it for further handling.

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

//this function sends a chat message to the backend by making a POST request to the /api/chat/ endpoint. It takes a query string as an argument, which is sent in the request body as JSON. The function includes error handling to manage any issues that may arise during the request. If the response is not successful, it attempts to parse the error message from the response and throws an error with that message or a generic one if parsing fails. If there is an error during the fetch operation, it logs the error to the console and rethrows it for further handling.

export async function sendChatMessage(query: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
