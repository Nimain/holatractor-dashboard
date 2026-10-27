/**
 * Utility to resolve the dynamic live backend API URL
 * Ensures localhost is excluded so production and cloud environments
 * communicate with the active live FastAPI server.
 */
export function getBackendBaseUrl(): string {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000";
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8000";
  }
  const candidate = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_TRACTOR_AI_URL || process.env.NEXT_PUBLIC_API_URL;
  const url = candidate || "http://localhost:8000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
