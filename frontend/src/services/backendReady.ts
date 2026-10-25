const READY_URL = "http://localhost:3000/api/health/ready";

export async function waitForBackend(timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(READY_URL, { cache: "no-store" });
      if (response.ok) {
        const data: unknown = await response.json();
        if (typeof data === "object" && data !== null &&
            "ready" in data && data.ready === true) return;
      }
    } catch { /* Backend is not listening yet. */ }
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Backend is not ready after 30 seconds. Check the server and MySQL logs.");
}
