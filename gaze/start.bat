@echo off
REM Windows - 더블클릭하세요.
cd /d "%~dp0"
where python >nul 2>nul || (echo python 이 필요합니다. https://www.python.org 에서 설치하세요. & pause & exit /b 1)
set PORT=8777
echo http://localhost:%PORT%  - 브라우저가 열립니다. 끝나면 이 창을 닫으세요.
start "" http://localhost:%PORT%
python -m http.server %PORT% --bind 127.0.0.1
