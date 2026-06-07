#!/usr/bin/env sh
set -e

echo "Waiting for Postgres to be ready..."
HOST=${DB_HOST:-db}
PORT=${DB_PORT:-5432}
USER=${DB_USER:-postgres}

until pg_isready -h "$HOST" -p "$PORT" -U "$USER" >/dev/null 2>&1; do
  printf '.'
  sleep 1
done

echo "Postgres is ready — starting server"
node server.js
