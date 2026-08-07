#!/bin/sh
# macOS / Linux — 더블클릭하거나 터미널에서 실행하세요.
cd "$(dirname "$0")" || exit 1
PY=$(command -v python3 || command -v python) || {
  echo "python 이 필요합니다. https://www.python.org 에서 설치하세요."; read -r _; exit 1; }
PORT=8777
echo "http://localhost:$PORT  — 브라우저가 열립니다. 끝나면 이 창을 닫으세요."
(sleep 1; (command -v open >/dev/null && open "http://localhost:$PORT") \
       || (command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT")) &
"$PY" -m http.server "$PORT" --bind 127.0.0.1
