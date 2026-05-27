// Vercel Edge Middleware — runs before rewrites, gates /admin and /post
// Requires ADMIN_TOKEN env var set in Vercel project settings (not VITE_ prefixed).

export const config = {
  matcher: ['/admin', '/post'],
}

export default function middleware(request) {
  const adminToken = process.env.ADMIN_TOKEN
  const cookie = request.cookies.get('phx_admin_token')

  if (adminToken && cookie?.value === adminToken) return // authenticated

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', new URL(request.url).pathname)
  return Response.redirect(loginUrl)
}
