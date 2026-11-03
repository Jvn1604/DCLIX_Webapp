@echo off
REM Runs the website + API on this PC: http://127.0.0.1:8000
REM Close this window to stop.
echo D-Clix local server: http://127.0.0.1:8000
start "" http://127.0.0.1:8000/
"C:\xampp\php\php.exe" -S 127.0.0.1:8000 -t "%~dp0."
