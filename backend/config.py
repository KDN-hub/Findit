# ──────────────────────────────────────────────────────────
# config.py — Robust "Search Party" .env loader
# ──────────────────────────────────────────────────────────
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# ── 1. SEARCH PARTY: Try multiple locations for .env (optional — works without file on Render) ──
_THIS_DIR = Path(__file__).resolve().parent  # backend/

_SEARCH_LOCATIONS = [
    _THIS_DIR / ".env",                          # backend/.env  (most common)
    _THIS_DIR.parent / ".env",                   # project root/.env
    Path.cwd() / ".env",                         # current working directory
    Path.home() / ".env",                        # user home (fallback)
]

_env_loaded = False
for _candidate in _SEARCH_LOCATIONS:
    if _candidate.exists():
        load_dotenv(dotenv_path=_candidate, override=True)
        print(f"[OK] Loaded .env from: {_candidate}")
        _env_loaded = True
        break                                    # first match wins

if not _env_loaded:
    # Optional: load_dotenv(override=True) does not fail if .env is missing (e.g. on Render)
    load_dotenv(override=True)
    print("[CONFIG] No .env file found; using environment variables only (OK for production/Render).")


# ── 2. CONFIGURATION VALUES ──
# Database
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "findit")
DB_PORT = int(os.getenv("DB_PORT", 3306))

# Auth
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# Email (MAIL_* naming — used by email_service, utils, main)
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
EMAIL_SERVER = os.getenv("EMAIL_SERVER", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))


# Resend (used instead of SMTP on Render free tier)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")

# ── 3. VALIDATION ──
def validate():
    """Call at startup to fail fast if critical env vars are missing (Resend)."""
    missing = []
    if not MAIL_FROM:
        missing.append("MAIL_FROM")
    if not RESEND_API_KEY:
        missing.append("RESEND_API_KEY")
    if missing:
        msg = f"Missing environment variables: {', '.join(missing)} — set MAIL_FROM and RESEND_API_KEY for email (Resend)."
        print(f"[ERROR] {msg}")
        raise ValueError(msg)
    print(f"[OK] Email config OK (Resend) -> sending as {MAIL_FROM}")


# ── 4. DEBUG SUMMARY ──
print(f"[CONFIG] MAIL_FROM     = {MAIL_FROM}")
print(f"[CONFIG] MAIL_USERNAME = {MAIL_USERNAME}")
print(f"[CONFIG] MAIL_PASSWORD = {'***SET***' if MAIL_PASSWORD else 'NOT SET [WARNING]'}")
print(f"[CONFIG] RESEND_API_KEY = {'***SET***' if RESEND_API_KEY else 'NOT SET [WARNING]'}")
print(f"[CONFIG] DB            = {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
