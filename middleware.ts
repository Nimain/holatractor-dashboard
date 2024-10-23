import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {

  // Get cookies from the request
  const token = req.cookies.get('access_token');
  const isFarmer = req.cookies.get('isFarmer')?.value === 'true';
  const isOwner = req.cookies.get('isOwner')?.value === 'true'
  const isOperator = req.cookies.get('isOperator')?.value === 'true'
  const isDealer = req.cookies.get('isDealer')?.value === 'true'

  // If there is no access_token, redirect to the login page
  if (!token) {
    return NextResponse.redirect(new URL(`/login`, req.url));
  }

  // Get the current pathname
  const { pathname } = req.nextUrl;

  // Conditional route access based on role
  if (isFarmer && !pathname.startsWith('/farmer')) {
    return NextResponse.redirect(new URL(`/farmer`, req.url));
  }

  if (isOwner && !pathname.startsWith('/owner')) {
    return NextResponse.redirect(new URL(`/owner`, req.url));
  }

  if (isOperator && !pathname.startsWith('/operator')) {
    return NextResponse.redirect(new URL(`/operator`, req.url));
  }

  if (isDealer && !pathname.startsWith('/dealer')) {
    return NextResponse.redirect(new URL(`/dealer`, req.url));
  }

  // If none of the roles are true, allow access to all routes
  if (!isFarmer && !isOwner && !isOperator && !isDealer) {
    return NextResponse.next();
  }

  // If there is an access_token, continue with the request
  return NextResponse.next();
}

// Define which paths should use this middleware
export const config = {
  matcher: ['/((?!login|register|create_admin|_next|static|favicon.ico).*)'], // Exclude login, register, and static paths
};
