@echo off
setlocal

cd /d "%~dp0"
set "PREVIEW_URL=http://localhost:3000"

echo.
echo SpeakUp production preview
echo Project: %CD%
echo.
echo Building the static export...
call npm run build
if errorlevel 1 (
  echo.
  echo Build failed. The preview server was not started.
  pause
  exit /b 1
)

if not exist "out\index.html" (
  echo.
  echo Build completed without out\index.html. The preview server was not started.
  pause
  exit /b 1
)

echo.
echo Starting the static preview server...
start "SpeakUp Preview" cmd /k "cd /d ""%~dp0"" && npm run preview"

for /l %%i in (1,1,20) do (
  powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%PREVIEW_URL%'; if ($response.StatusCode -eq 200) { exit 0 } } catch {} exit 1" >nul 2>&1
  if not errorlevel 1 goto :open_preview
  timeout /t 1 /nobreak >nul
)

:open_preview
echo.
echo Preview URL: %PREVIEW_URL%
start "" "%PREVIEW_URL%"
echo.
echo The preview server is running in the SpeakUp Preview window.
echo Close that window when you are finished.

endlocal
