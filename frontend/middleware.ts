import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public paths that don't require authentication
const publicPaths = [
    "/login",
    "/logout",
    "/forgot-password",
    "/reset-password",
    "/api/auth/login",
    "/api/auth/reset-request",
    "/api/auth/reset-password",
    "/widget", // Public chat widget route group
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow access to public paths
    // Check if it's explicitly public or starts with a public route group
    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(path)
    );

    // Also allow static assets and internal next.js requests
    const isNextInternal = pathname.startsWith("/_next") ||
        pathname.includes("/favicon.ico") ||
        pathname.startsWith("/static");

    if (isPublicPath || isNextInternal) {
        return NextResponse.next();
    }

    // 2. Check for authentication token
    // In a real implementation, we would check for a session cookie/JWT
    // For now, we simulate by checking for 'auth-token' cookie
    const authToken = request.cookies.get("auth-token");

    if (!authToken) {
        // Redirect to login if unauthenticated
        const loginUrl = new URL("/login", request.url);
        // loginUrl.searchParams.set("from", pathname); // Optional: redirect back after login
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Ensure middleware runs for all routes except static files
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
