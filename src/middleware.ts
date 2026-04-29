import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/api/auth")

  if (isAuthRoute) {
    if (isLoggedIn && !isApiRoute) {
      return Response.redirect(new URL("/", nextUrl))
    }
    return
  }

  if (!isLoggedIn && !isAuthRoute) {
    return Response.redirect(new URL("/login", nextUrl))
  }

  return
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)"],
}
