import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token
    
    // Protect private routes
    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Check if the user has a workspace for dashboard
    // We store workspaceId in the token. If they don't have one, force onboarding.
    const hasWorkspace = req.nextauth.token && !!req.nextauth.token.workspaceId
    const isDashboard = req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.match(/^\/(reports|analytics|affiliate|data-sources|settings)/)

    if (isAuth && !hasWorkspace && isDashboard) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      // Return true to allow the middleware function to run
      authorized: () => true 
    }
  }
)

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/reports/:path*",
    "/analytics/:path*",
    "/affiliate/:path*",
    "/marketing-intelligence/:path*",
    "/data-health/:path*",
    "/data-sources/:path*",
    "/settings/:path*"
  ]
}
