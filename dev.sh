#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill ports
lsof -ti:5002,5173,5174 | xargs kill -9 2>/dev/null

trap 'kill $(jobs -p) 2>/dev/null' EXIT INT TERM

# Backend
dotnet run --launch-profile http \
  --project "$ROOT/src/backend/src/Rms.Av.Api/Rms.Av.Api.csproj" 2>&1 | \
while IFS= read -r line; do
  [[ "$line" == *"Now listening on"* ]] && printf "\nBackend Started\n\n"
done &

# Frontend
(cd "$ROOT/src/frontend" && pnpm dev 2>&1) | \
while IFS= read -r line; do
  if [[ "$line" == *"Local:"*"5173"* ]]; then
    printf "\nFrontend Started\n\nAdmin Portal URL:    http://localhost:5173\n"
  elif [[ "$line" == *"Local:"*"5174"* ]]; then
    printf "Customer Portal URL: http://localhost:5174\n\n"
  fi
done &

wait
