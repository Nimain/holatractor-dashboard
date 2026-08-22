import { type NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  // Get cookies from the request
  const token = req.cookies.get("access_token")

  // Debug all cookies with more detailed information
  const allCookies = req.cookies.getAll()
  console.log(
    "All cookies in middleware:",
    allCookies.map((c) => ({ name: c.name, value: c.value })),
  )

  // Parse role cookies - ensure we're comparing with string "true"
  const isFarmer = req.cookies.get("isFarmer")?.value === "true"
  const isOwner = req.cookies.get("isOwner")?.value === "true"
  const isOperator = req.cookies.get("isOperator")?.value === "true"
  const isDealer = req.cookies.get("isDealer")?.value === "true"
  const isAgent = req.cookies.get("isAgent")?.value === "true"

  // Add more detailed debugging for the isAgent cookie specifically
  console.log("isAgent cookie details:", {
    exists: req.cookies.has("isAgent"),
    rawValue: req.cookies.get("isAgent")?.value,
    parsedValue: isAgent,
  })

  // Get the current pathname
  const { pathname } = req.nextUrl

  // Allow all API routes to pass through without redirecting to login pages
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // If there is no access_token and no authorization header, redirect to the login page
  const authHeader = req.headers.get("authorization")
  if (!token && !authHeader) {
    console.log("No access token, redirecting to login")
    return NextResponse.redirect(new URL(`/login`, req.url))
  }

  // Check each role and redirect if not on the correct path
  // Process only one role at a time, with priority order

  // Check agent role first (assuming this is the one having issues)
  if (isAgent && !pathname.startsWith("/agent")) {
    console.log("Agent detected, redirecting to /agent")
    return NextResponse.redirect(new URL(`/agent`, req.url))
  }

  // Then check other roles
  if (isFarmer && !pathname.startsWith("/farmer")) {
    console.log("Farmer detected, redirecting to /farmer")
    return NextResponse.redirect(new URL(`/farmer`, req.url))
  }

  if (isOwner && !pathname.startsWith("/owner")) {
    console.log("Owner detected, redirecting to /owner")
    return NextResponse.redirect(new URL(`/owner`, req.url))
  }

  if (isOperator && !pathname.startsWith("/operator")) {
    console.log("Operator detected, redirecting to /operator")
    return NextResponse.redirect(new URL(`/operator`, req.url))
  }

  if (isDealer && !pathname.startsWith("/dealer")) {
    console.log("Dealer detected, redirecting to /dealer")
    return NextResponse.redirect(new URL(`/dealer`, req.url))
  }

  // If none of the roles are true, allow access to all routes
  if (!isFarmer && !isOwner && !isOperator && !isDealer && !isAgent) {
    console.log("No specific role detected, allowing access")
    return NextResponse.next()
  }

  // If there is an access_token and user is on the correct path, continue with the request
  console.log("Access token exists, continuing with request")
  return NextResponse.next()
}

// Define which paths should use this middleware
export const config = {
  matcher: ["/((?!login|register|create_admin|_next|static|favicon.ico).*)"], // Exclude login, register, and static paths
}
