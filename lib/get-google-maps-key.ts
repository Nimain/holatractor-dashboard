export async function getGoogleMapsApiKey(): Promise<string> {
  // Get it from: https://console.cloud.google.com/
  // Or add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your Vars section
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg"

  if (apiKey === "AIzaSyDjMCI0xj2Q-WTc9J7yWX-Mvh0DBM7oHbg") {
    // console.warn(
    //   "[v0] Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.",
    // )
  }

  return apiKey
}
