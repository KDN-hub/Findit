import smtplib
from email.message import EmailMessage
import os
import config  # loads .env automatically

# Use centralized config values
SMTP_SERVER = config.EMAIL_SERVER
SMTP_PORT = config.EMAIL_PORT
SENDER_EMAIL = config.MAIL_FROM
SENDER_PASSWORD = config.MAIL_PASSWORD
MAIL_USERNAME = config.MAIL_USERNAME


def send_login_alert(email: str):
    """
    Sends a security alert email when a user successfully logs in.
    Designed to run as a FastAPI BackgroundTask so it won't block the response.
    """
    try:
        print(f"[EMAIL DEBUG] Attempting to send email to {email}...")
        print(f"[EMAIL DEBUG] Using Credentials: {os.getenv('MAIL_USERNAME') or os.getenv('MAIL_FROM')} (password masked)")
        print(f"[EMAIL DEBUG] SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
        print(f"[EMAIL DEBUG] Sender Email: {SENDER_EMAIL}")
        
        subject = "New Login to FindIt"
        
        html_body = """
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #003898; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0;">FindIt</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">Security Alert</h2>
              <p>Hello!</p>
              <p>We detected a new login to your FindIt account just now. If this was you, you can ignore this message.</p>
              <p>If you did <strong>not</strong> initiate this login, please secure your account immediately by changing your password.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">
                This is an automated security notification from FindIt. Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
        """
        
        # Plain text fallback
        text_body = "Hello! We detected a new login to your FindIt account just now. If this was you, you can ignore this message."
        
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg["To"] = email
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
        
        print(f"[EMAIL DEBUG] Connecting to SMTP server...")
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            # Use MAIL_USERNAME for login if provided, otherwise use MAIL_FROM
            login_username = MAIL_USERNAME if MAIL_USERNAME else SENDER_EMAIL
            print(f"[EMAIL DEBUG] Logging in with username: {login_username}")
            server.login(login_username, SENDER_PASSWORD)
            print(f"[EMAIL DEBUG] Login successful, sending message...")
            server.send_message(msg)
        print(f"[EMAIL] Login alert sent to {email}")
        
    except Exception as e:
        # CRITICAL: Print the full error message
        print(f"[EMAIL FAILED] Failed to send login alert to {email}: {str(e)}")
        print(f"[EMAIL FAILED] Error type: {type(e).__name__}")
        import traceback
        print(f"[EMAIL FAILED] Full traceback:")
        traceback.print_exc()
        # Re-raise the error so it's visible
        raise
