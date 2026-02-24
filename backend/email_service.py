import smtplib
from email.message import EmailMessage
import config  # loads .env automatically

# Use centralized config values
SMTP_SERVER = config.EMAIL_SERVER
SMTP_PORT = config.EMAIL_PORT
SENDER_EMAIL = config.MAIL_FROM
SENDER_PASSWORD = config.MAIL_PASSWORD
MAIL_USERNAME = config.MAIL_USERNAME


def send_login_alert_email(user_email: str, user_name: str):
    """
    Sends a security alert email on successful login.
    Designed to run as a FastAPI BackgroundTask so it won't block the response.
    """
    name = user_name or "User"

    subject = "Security Alert: New login to Findit"

    html_body = f"""\
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4A90D9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">Findit</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Security Alert</h2>
          <p>Hello <strong>{name}</strong>,</p>
          <p>We noticed a successful login to your <strong>Findit</strong> account just now.</p>
          <p>If this was you, no action is needed.</p>
          <p>If you did <strong>not</strong> initiate this login, please secure your account immediately
             by changing your password and contacting our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">
            This is an automated security notification from Findit. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
    """

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = user_email
    msg.set_content(f"Hello {name}, we noticed a successful login to your Findit account just now. If this was you, no action is needed.")
    msg.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            # Use MAIL_USERNAME for login if provided, otherwise use MAIL_FROM
            login_username = MAIL_USERNAME if MAIL_USERNAME else SENDER_EMAIL
            server.login(login_username, SENDER_PASSWORD)
            server.send_message(msg)
        print(f"[EMAIL] Login alert sent to {user_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send login alert to {user_email}: {e}")
