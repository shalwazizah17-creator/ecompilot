export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all routes except auth API, static files, and public pages (login, register)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|images).*)",
  ]
}
