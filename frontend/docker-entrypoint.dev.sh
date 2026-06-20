#!/bin/sh
set -e

mkdir -p /app/.next
find /app/.next -mindepth 1 -delete 2>/dev/null || true
chown -R node:node /app/.next

exec su-exec node "$@"
