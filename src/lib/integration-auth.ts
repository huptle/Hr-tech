import type { NextRequest } from "next/server";

export function isIntegrationSecretConfigured(): boolean {
  return Boolean(process.env.CANDIDATE_SYNC_SECRET?.trim());
}

export function authorizeIntegrationRequest(req: NextRequest): boolean {
  const secret = process.env.CANDIDATE_SYNC_SECRET?.trim();
  if (!secret) return false;
  const header =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-candidate-sync-secret");
  return header === secret;
}
