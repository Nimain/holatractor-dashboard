import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {

  // Get cookies from the request
  const token = req.cookies.get('access_token');

  // If there is no access_token, redirect to the login page
  if (!token) {
    return NextResponse.redirect(new URL(`/login`, req.url));
  }

  // If there is an access_token, continue with the request
  return NextResponse.next();
}

// Define which paths should use this middleware
export const config = {
  matcher: ['/((?!login|register|_next|static|favicon.ico).*)'], // Exclude login, register, and static paths
};
