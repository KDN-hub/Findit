import os
import sys
from dotenv import load_dotenv

# Force load .env
load_dotenv()

# Add backend to path so we can import utils
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from backend.utils import send_login_alert
    print("✅ Imported send_login_alert")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Get target email from args or env
target_email = os.getenv("MAIL_FROM")
print(f"📧 Attempting to send login alert to: {target_email}")

try:
    send_login_alert(target_email)
    print("✅ Login alert sent successfully!")
except Exception as e:
    print(f"❌ Failed to send login alert: {e}")
