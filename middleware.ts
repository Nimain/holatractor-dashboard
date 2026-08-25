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
  const isAdmin = req.cookies.get("isAdmin")?.value === "true"

  // 1. Admin has unrestricted access to all dashboards and management pages
  if (isAdmin) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL(`/City`, req.url));
    }
    return NextResponse.next();
  }

  // 2. If user is currently visiting a path that matches one of their active roles, ALLOW IT!
  if (pathname.startsWith("/owner") && isOwner) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/dealer") && isDealer) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/agent") && isAgent) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/operator") && isOperator) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/farmer") && isFarmer) {
    return NextResponse.next();
  }

  // 3. If user is on the root path `/` or generic common pages, redirect based on active_role or primary role
  if (pathname === "/" || pathname === "") {
    const activeRole = req.cookies.get("active_role")?.value;

    if (activeRole === "owner" && isOwner) {
      return NextResponse.redirect(new URL(`/owner`, req.url));
    }
    if (activeRole === "farmer" && isFarmer) {
      return NextResponse.redirect(new URL(`/farmer`, req.url));
    }
    if (activeRole === "dealer" && isDealer) {
      return NextResponse.redirect(new URL(`/dealer`, req.url));
    }
    if (activeRole === "agent" && isAgent) {
      return NextResponse.redirect(new URL(`/agent`, req.url));
    }
    if (activeRole === "operator" && isOperator) {
      return NextResponse.redirect(new URL(`/operator`, req.url));
    }

    if (isOwner) {
      return NextResponse.redirect(new URL(`/owner`, req.url));
    }
    if (isDealer) {
      return NextResponse.redirect(new URL(`/dealer`, req.url));
    }
    if (isAgent) {
      return NextResponse.redirect(new URL(`/agent`, req.url));
    }
    if (isOperator) {
      return NextResponse.redirect(new URL(`/operator`, req.url));
    }
    if (isFarmer) {
      return NextResponse.redirect(new URL(`/farmer`, req.url));
    }
    return NextResponse.next();
  }

  // 4. If accessing a role-specific dashboard for which they do NOT have permission:
  if (pathname.startsWith("/owner") && !isOwner) {
    const target = isDealer ? "/dealer" : isAgent ? "/agent" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/dealer") && !isDealer) {
    const target = isOwner ? "/owner" : isAgent ? "/agent" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/agent") && !isAgent) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isOperator ? "/operator" : isFarmer ? "/farmer" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/operator") && !isOperator) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isAgent ? "/agent" : isFarmer ? "/farmer" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/farmer") && !isFarmer) {
    const target = isOwner ? "/owner" : isDealer ? "/dealer" : isAgent ? "/agent" : isOperator ? "/operator" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Allow general administrative pages (e.g. /Devices, /Store, /Inventory, etc.) if authenticated
  return NextResponse.next();
}

// Define which paths should use this middleware
export const config = {
  matcher: ["/((?!login|register|farmer_login|create_admin|_next|static|favicon.ico).*)"],
}
