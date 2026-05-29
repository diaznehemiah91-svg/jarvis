@echo off
REM ============================================================
REM  J.A.R.V.I.S  -  Command Center launcher
REM  Starts the backend and opens the dashboard in a Chrome app
REM  window. Double-click to run, or let Windows run it at boot.
REM ============================================================

cd /d "%~dp0"

REM Use pythonw (no console window) if available, else python.
where pythonw >nul 2>nul
if %ERRORLEVEL%==0 (
    start "" pythonw jarvis_boot.py
) else (
    start "" python jarvis_boot.py
)

exit
