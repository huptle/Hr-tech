#!/bin/sh
set -e
# Apply schema to SQLite (volume-backed in Docker).
# Client is generated at image build; skip generate (global prisma is root-owned).
prisma db push --skip-generate --schema=/app/prisma/schema.prisma
exec node server.js
