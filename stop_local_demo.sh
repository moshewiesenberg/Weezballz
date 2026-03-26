#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/.local-demo"

for name in backend static; do
  pid_file="$LOG_DIR/$name.pid"
  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    kill "$(cat "$pid_file")"
    rm -f "$pid_file"
    echo "Stopped $name."
  fi
done
