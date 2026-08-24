import { type NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  // Get cookies from the request
  const token = req.cookies.get("access_token")
  const authHeader = req.headers.get("authorization")

  const { pathname } = req.nextUrl

  // Allow all API routes to pass through without redirecting to login pages
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // If there is no access_token and no authorization header, redirect to the login page
  if (!token && !authHeader) {
    console.log("No access token, redirecting to login")
    return NextResponse.redirect(new URL(`/login`, req.url))
  }

  // Parse role cookies - ensure we're comparing with string "true"
  const isOwner = req.cookies.get("isOwner")?.value === "true"
  const isDealer = req.cookies.get("isDealer")?.value === "true"
  const isAgent = req.cookies.get("isAgent")?.value === "true"
  const isOperator = req.cookies.get("isOperator")?.value === "true"
  const isFarmer = req.cookies.get("isFarmer")?.value === "true"

  // 1. If user is currently visiting a path that matches one of their active roles, ALLOW IT!
  if (pathname.startsWith("/owner") && isOwner) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/dealer") && isDealer) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/agent") && isAgent) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/operator") && isOperator) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/farmer") && isFarmer) {
    return NextResponse.next()
  }

  // 2. If user is on the root path `/` or generic common pages, redirect to their primary role (Owner highest priority)
  if (pathname === "/" || pathname === "") {
    if (isOwner) {
      console.log("Owner detected, redirecting to /owner")
      return NextResponse.redirect(new URL(`/owner`, req.url))
    }
    if (isDealer) {
      console.log("Dealer detected, redirecting to /dealer")
      return NextResponse.redirect(new URL(`/dealer`, req.url))
    }
    if (isAgent) {
      console.log("Agent detected, redirecting to /agent")
      return NextResponse.redirect(new URL(`/agent`, req.url))
    }
    if (isOperator) {
      console.log("Operator detected, redirecting to /operator")
      return NextResponse.redirect(new URL(`/operator`, req.url))
    }
    if (isFarmer) {
      console.log("Farmer detected, redirecting to /farmer")
      return NextResponse.redirect(new URL(`/farmer`, req.url))
    }
    return NextResponse.next()
  }

  // 3. If accessing a role-specific dashboard for which they do NOT have permission:
  if (pathname.startsWith("/owner") && !isOwner) {
    const target = isDealer ? "/dealer" : isAgent ? "/agent" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }
  if (pathname.startsWith("/dealer") && !isDealer) {
    const target = isOwner ? "/owner" : isAgent ? "/agent" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }
  if (pathname.startsWith("/agent") && !isAgent) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }
  if (pathname.startsWith("/operator") && !isOperator) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isAgent ? "/agent" : isFarmer ? "/farmer" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }
  if (pathname.startsWith("/farmer") && !isFarmer) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isAgent ? "/agent" : isOperator ? "/operator" : "/"
    return NextResponse.redirect(new URL(target, req.url))
  }

  // Allow general administrative pages (e.g. /Devices, /Store, etc.) if authenticated
  return NextResponse.next()
}

// Define which paths should use this middleware
export const config = {
  matcher: ["/((?!login|register|farmer_login|create_admin|_next|static|favicon.ico).*)"],
}
