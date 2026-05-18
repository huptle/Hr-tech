import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "hr_session";
/** Pages where anonymous users are allowed (sign-in flow). */
const PUBLIC_PATHS = new Set(["/signin", "/signup"]);
/**
 * Routes that skip session check in proxy (auth handled inside the handler).
 * Must NOT be treated like signin/signup — signed-in users must still reach these.
 */
const SESSION_OPTIONAL_PATHS = new Set([
  "/api/resume/parse",
  "/api/webhooks/vapi",
  "/api/auth/google/callback",
]);

function getSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthPage = PUBLIC_PATHS.has(pathname);
  const allowWithoutSession = isAuthPage || SESSION_OPTIONAL_PATHS.has(pathname);
  const authed = await hasValidSession(req);

  if (!authed && !allowWithoutSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every route except Next internals, static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js|map)$).*)",
  ],
};
