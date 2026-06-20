#!/bin/sh
set -e

mkdir -p /app/dist
find /app/dist -mindepth 1 -delete 2>/dev/null || true
chown -R node:node /app/dist

exec su-exec node "$@"
