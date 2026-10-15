import { NextRequest, NextResponse } from "next/server";
import { verifyPartnerToken } from "@/lib/partner-auth";
import { createProfile } from "@/server/services/profile.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const redirectParam = searchParams.get("redirect") || "/dashboard";

  if (!token) {
    return new NextResponse(
      renderErrorHtml("Missing SSO Token", "No authentication token was provided in the request."),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const payload = verifyPartnerToken(token);
    const email = payload.email.trim().toLowerCase();
    const name = payload.name?.trim() || email.split("@")[0];
    const targetRedirect = payload.redirect || redirectParam;

    // 1. Ensure a profile exists for this candidate
    try {
      await createProfile({
        name,
        email,
        phone: payload.phone || "",
        skills: [],
        experience: "",
        education: "",
        summary: `Partner authenticated via ${payload.iss || "Mentorlee"} (ID: ${payload.sub})`,
      });
    } catch (profileErr) {
      console.warn("[partner-sso] Profile save non-fatal notice:", profileErr);
    }

    // 2. Set HttpOnly session cookie
    const response = new NextResponse(
      renderSuccessHandoffHtml(email, name, targetRedirect),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );

    response.cookies.set("huptle_apply_session_email", email, {
      path: "/",
      httpOnly: false, // Accessible to client-side scripts if needed
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set("huptle_partner_session", JSON.stringify({ email, sub: payload.sub, iss: payload.iss || "mentorlee" }), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    console.error("[partner-sso] SSO verification failed:", message);
    return new NextResponse(
      renderErrorHtml("Authentication Failed", message),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function renderSuccessHandoffHtml(email: string, name: string, redirectUrl: string): string {
  const safeEmail = JSON.stringify(email);
  const safeRedirect = JSON.stringify(redirectUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Authenticating with Huptle...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #0b0f17;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #141c2b;
      border: 1px solid #1e293b;
      padding: 2.5rem;
      border-radius: 1rem;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 1.5rem;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 700; }
    p { margin: 0; font-size: 0.875rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Connecting to Huptle</h2>
    <p>Signed in as ${escapeHtml(name)}. Redirecting you to your destination...</p>
  </div>
  <script>
    try {
      localStorage.setItem("huptle_apply_session_email", ${safeEmail});
    } catch(e) {}
    window.location.replace(${safeRedirect});
  </script>
</body>
</html>`;
}

function renderErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #0b0f17;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: #141c2b;
      border: 1px solid #dc2626;
      padding: 2.5rem;
      border-radius: 1rem;
      text-align: center;
      max-width: 420px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    h2 { margin: 0 0 0.75rem; color: #f87171; font-size: 1.25rem; font-weight: 700; }
    p { margin: 0 0 1.5rem; font-size: 0.875rem; color: #94a3b8; line-height: 1.5; }
    a {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      padding: 0.6rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    a:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(message)}</p>
    <a href="/">Go to Home</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
