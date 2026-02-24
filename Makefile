dev:
	@bash dev.sh

backend:
	lsof -ti:5002 | xargs kill -9 2>/dev/null; cd src/backend/src/Rms.Av.Api && dotnet run --launch-profile http

frontend:
	lsof -ti:5173,5174 | xargs kill -9 2>/dev/null; cd src/frontend && pnpm dev
