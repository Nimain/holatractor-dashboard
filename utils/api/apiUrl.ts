/**
 * Utility to resolve the dynamic live backend API URL
 * Ensures localhost is excluded so production and cloud environments
 * communicate with the active live FastAPI server.
 */
export function getBackendBaseUrl(): string {
  // Localhost configuration commented for future use:
  // if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
  //   return "http://localhost:8000";
  // }
  // if (process.env.NODE_ENV !== "production") {
  //   return "http://localhost:8000";
  // }

  const candidate = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_TRACTOR_AI_URL || process.env.NEXT_PUBLIC_API_URL;
  // Fallback to AWS live API (localhost:8000 commented for future use):
  // const url = candidate || "http://localhost:8000";
  const url = candidate || "https://tractorai.sinsignal.com";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
