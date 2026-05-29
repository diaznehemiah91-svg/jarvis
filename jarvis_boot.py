"""
JARVIS boot launcher.

Starts the JARVIS web backend, waits until it's ready, then opens the
Command Center in a clean Chrome application window (no tabs / address bar).
Designed to be launched at Windows startup via start_jarvis.bat.

Usage:
    python jarvis_boot.py
"""
import os
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser

HOST = "127.0.0.1"
PORT = 8765
URL = f"http://localhost:{PORT}/command/"


def find_chrome() -> str | None:
    """Locate the Chrome executable across common Windows/macOS/Linux paths."""
    candidates = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None


def start_server() -> None:
    """Run the Flask web backend (blocks)."""
    # Import here so the module loads in this process/thread
    from demo_server import app
    app.run(host=HOST, port=PORT, debug=False, use_reloader=False, threaded=True)


def wait_for_server(timeout: float = 25.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(URL, timeout=1.5)
            return True
        except Exception:
            time.sleep(0.4)
    return False


def open_app_window() -> None:
    chrome = find_chrome()
    if chrome:
        # --app mode = chromeless application window (premium kiosk feel)
        subprocess.Popen([
            chrome,
            f"--app={URL}",
            "--start-maximized",
            "--new-window",
            f"--user-data-dir={os.path.join(os.path.expanduser('~'), '.jarvis-chrome')}",
        ])
    else:
        print("[jarvis] Chrome not found — opening in default browser.")
        webbrowser.open(URL)


def main() -> None:
    print("=" * 52)
    print("  J.A.R.V.I.S  —  Command Center booting…")
    print("=" * 52)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    print(f"[jarvis] starting backend on {URL} …")
    if wait_for_server():
        print("[jarvis] backend ready — launching Command Center window")
        open_app_window()
    else:
        print("[jarvis] backend did not respond in time; opening anyway")
        open_app_window()

    # Keep the process (and server) alive while the dashboard is open.
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\n[jarvis] shutting down. Goodbye, sir.")


if __name__ == "__main__":
    main()
