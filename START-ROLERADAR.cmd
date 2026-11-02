@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
call npm ls --depth=0 >nul 2>&1
if errorlevel 1 (
  call npm ci
  if errorlevel 1 exit /b 1
)
call npm run build
if errorlevel 1 exit /b 1
set APP_URL=http://127.0.0.1:3001
set SERVE_FRONTEND=true
set PORT=3001
echo Open http://127.0.0.1:3001 after the ready message. Keep this window open.
node server/index.mjs
pause
