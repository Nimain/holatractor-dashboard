/**
 * Utility to resolve the dynamic live backend API URL
 * Ensures localhost is excluded so production and cloud environments
 * communicate with the active live FastAPI server.
 */
export function getBackendBaseUrl(): string {
  const candidate = [
    process.env.FASTAPI_URL,
    process.env.NEXT_PUBLIC_TRACTOR_AI_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter((url): url is string => Boolean(url && !url.includes("localhost") && !url.includes("127.0.0.1")))[0];

  const url = candidate || "https://tractorai.sinsignal.com";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
