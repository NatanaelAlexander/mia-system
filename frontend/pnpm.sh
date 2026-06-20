#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Uso: ./frontend/pnpm.sh <comando pnpm> [args...]

Ejemplos:
  ./frontend/pnpm.sh add lucide-react
  ./frontend/pnpm.sh add -D @types/node
  ./frontend/pnpm.sh remove lucide-react
  ./frontend/pnpm.sh install

Ejecuta pnpm dentro del contenedor frontend (no necesitas Node/pnpm local).
Si el stack no está arriba, lo levanta automáticamente.
EOF
}

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

args=("$@")
if [[ "${1:-}" == "add" || "${1:-}" == "remove" || "${1:-}" == "update" ]]; then
  args=("$1" "-w" "${@:2}")
fi

if ! docker compose ps frontend --status running -q 2>/dev/null | grep -q .; then
  echo ">> Frontend no está corriendo. Levantando servicios..."
  docker compose up -d
  echo ">> Esperando a que el frontend arranque..."
  for _ in $(seq 1 30); do
    if docker compose ps frontend --status running -q 2>/dev/null | grep -q .; then
      break
    fi
    sleep 2
  done
fi

echo ">> pnpm ${args[*]}"
docker compose exec frontend sh -c \
  'pnpm config set store-dir /root/.local/share/pnpm/store >/dev/null && pnpm "$@"' \
  _ "${args[@]}"

echo ">> Listo."
