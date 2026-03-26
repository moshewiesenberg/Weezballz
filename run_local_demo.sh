#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT/.local-demo"
UVICORN_BIN="$HOME/Library/Python/3.9/bin/uvicorn"
PYTHON_BIN="/usr/bin/python3"
BACKEND_PID="$LOG_DIR/backend.pid"
STATIC_PID="$LOG_DIR/static.pid"

mkdir -p "$LOG_DIR"

if [[ -f "$BACKEND_PID" ]] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
  echo "Backend already running (pid $(cat "$BACKEND_PID"))."
else
  nohup "$UVICORN_BIN" --app-dir "$ROOT/backend" modal_agent:web_app --host 127.0.0.1 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$BACKEND_PID"
  echo "Started backend (pid $(cat "$BACKEND_PID"))."
fi

if [[ -f "$STATIC_PID" ]] && kill -0 "$(cat "$STATIC_PID")" 2>/dev/null; then
  echo "Static server already running (pid $(cat "$STATIC_PID"))."
else
  nohup "$PYTHON_BIN" -m http.server 9000 --bind 127.0.0.1 --directory "$ROOT" > "$LOG_DIR/static.log" 2>&1 &
  echo $! > "$STATIC_PID"
  echo "Started static server (pid $(cat "$STATIC_PID"))."
fi

echo ""
echo "Backend: http://127.0.0.1:8000/status"
echo "Demo:    http://127.0.0.1:9000/demo/outlook_preview.html"
