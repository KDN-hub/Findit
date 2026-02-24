import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config  # loads .env automatically

# Use centralized config values
SMTP_SERVER = config.EMAIL_SERVER
SMTP_PORT = config.EMAIL_PORT
SENDER_EMAIL = config.MAIL_FROM
SENDER_PASSWORD = config.MAIL_PASSWORD
MAIL_USERNAME = config.MAIL_USERNAME


def send_login_alert(recipient_email: str, recipient_name: str | None = None):
    """
    Sends a security alert email when a user logs in via Google.
    Designed to be called as a FastAPI BackgroundTask.
    """
    name = recipient_name or "User"

    subject = "Security Alert: New Login to Findit"

    html_body = f"""\
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4A90D9; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">Findit</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Security Alert</h2>
          <p>Hello <strong>{name}</strong>,</p>
          <p>We noticed a recent login to your <strong>Findit</strong> account using <strong>Google</strong>.</p>
          <p>If this was you, you can safely ignore this message.</p>
          <p>If you did <strong>not</strong> initiate this login, please secure your account immediately by changing your Google password and contacting our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">This is an automated security notification from Findit. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            # Use MAIL_USERNAME for login if provided, otherwise use MAIL_FROM
            login_username = MAIL_USERNAME if MAIL_USERNAME else SENDER_EMAIL
            server.login(login_username, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
        print(f"[EMAIL] Login alert sent to {recipient_email}")
    except Exception as e:
        # Log the error but don't crash — this runs in a background task
        print(f"[EMAIL ERROR] Failed to send login alert to {recipient_email}: {e}")
