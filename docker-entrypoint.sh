#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL is not set" >&2
  exit 1
fi
if [ -z "${AUTH_SECRET:-}" ] || [ "${#AUTH_SECRET}" -lt 16 ]; then
  echo "FATAL: AUTH_SECRET is missing or shorter than 16 characters" >&2
  exit 1
fi

echo "[entrypoint] Applying Prisma schema..."
prisma db push --skip-generate || {
  echo "[entrypoint] prisma db push failed" >&2
  exit 1
}

echo "[entrypoint] Starting Next.js on :${PORT:-3000}..."
exec "$@"
