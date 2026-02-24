"""
📧 Email Doctor — Standalone email connection debugger
Run: python email_doctor.py
"""
import os
import sys
import smtplib
from pathlib import Path
from email.message import EmailMessage
from dotenv import load_dotenv

# ── 1. FORCE LOAD .env ──
print("=" * 60)
print("📧  EMAIL DOCTOR — Diagnosing your email setup")
print("=" * 60)

env_path = Path(__file__).resolve().parent / ".env"
print(f"\n🔍 Looking for .env at: {env_path}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"✅ Found and loaded .env from: {env_path}")
else:
    print(f"❌ CRITICAL: No .env file found at {env_path}")
    print("   → Create a .env file in this folder with your email credentials.")
    sys.exit(1)

# ── 2. VERIFY VARIABLES ──
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
EMAIL_SERVER = os.getenv("EMAIL_SERVER", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 465))

print("\n── Loaded Configuration ──")
print(f"  MAIL_USERNAME : {MAIL_USERNAME or '⚠️  NOT SET'}")
print(f"  MAIL_FROM     : {MAIL_FROM or '⚠️  NOT SET'}")
print(f"  MAIL_PASSWORD : {'*' * len(MAIL_PASSWORD) if MAIL_PASSWORD else '⚠️  NOT SET'}")
print(f"  EMAIL_SERVER  : {EMAIL_SERVER}")
print(f"  EMAIL_PORT    : {EMAIL_PORT}")

if not MAIL_USERNAME or not MAIL_PASSWORD or not MAIL_FROM:
    print("\n❌ MISSING VARIABLES — Cannot proceed without MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM.")
    sys.exit(1)

# ── 3. TEST CONNECTION ──
print(f"\n── Testing SMTP Connection ──")
print(f"  Connecting to {EMAIL_SERVER}:{EMAIL_PORT} via SSL...")

try:
    with smtplib.SMTP_SSL(EMAIL_SERVER, EMAIL_PORT, timeout=15) as server:
        print("  ✅ Connected to SMTP server!")

        print(f"  Logging in as {MAIL_USERNAME}...")
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        print("  ✅ Login successful!")

        # Build a simple test email
        msg = EmailMessage()
        msg["Subject"] = "🔬 Email Doctor — Test Email"
        msg["From"] = MAIL_FROM
        msg["To"] = MAIL_FROM  # send to yourself
        msg.set_content(
            "This is a test email from email_doctor.py.\n"
            "If you received this, your email configuration is working correctly! ✅"
        )

        print(f"  Sending test email to {MAIL_FROM}...")
        server.send_message(msg)
        print("  ✅ Test email sent successfully!")

    print("\n" + "=" * 60)
    print("🎉  ALL CHECKS PASSED — Your email setup is working!")
    print(f"    Check the inbox of {MAIL_FROM} for the test email.")
    print("=" * 60)

except smtplib.SMTPAuthenticationError as e:
    print(f"\n  ❌ AUTHENTICATION FAILED: {e}")
    print("     → Your username or password is wrong.")
    print("     → If using Gmail, make sure you are using an App Password,")
    print("       NOT your regular Gmail password.")
    print("     → Generate one at: https://myaccount.google.com/apppasswords")

except smtplib.SMTPConnectError as e:
    print(f"\n  ❌ CONNECTION FAILED: {e}")
    print(f"     → Cannot reach {EMAIL_SERVER}:{EMAIL_PORT}")
    print("     → Check your internet connection and firewall settings.")

except smtplib.SMTPException as e:
    print(f"\n  ❌ SMTP ERROR: {e}")

except TimeoutError:
    print(f"\n  ❌ TIMEOUT: Could not connect to {EMAIL_SERVER}:{EMAIL_PORT} within 15 seconds.")
    print("     → Check if your network/firewall blocks port 465.")

except Exception as e:
    print(f"\n  ❌ UNEXPECTED ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
