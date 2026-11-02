import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
const protectedRoute = createRouteMatcher(["/dashboard(.*)", "/user(.*)"]);
export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (protectedRoute(request) && !(await convexAuth.isAuthenticated()))
      return nextjsMiddlewareRedirect(
        request,
        `/login?next=${encodeURIComponent(request.nextUrl.pathname)}`
      );
  },
  { shouldHandleCode: false }
);
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
