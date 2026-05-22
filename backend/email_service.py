import os
import traceback
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config

# Fix for Render: Force IPv4 because Render free tier doesn't support IPv6
# which causes "Network is unreachable" when smtplib tries to connect to Gmail's IPv6 address.
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

# Use centralized config values
SMTP_SERVER = config.EMAIL_SERVER
SMTP_PORT = config.EMAIL_PORT
SENDER_EMAIL = config.MAIL_FROM or config.EMAIL_SENDER or "finditappbu@gmail.com"
SENDER_PASSWORD = config.MAIL_PASSWORD or config.EMAIL_PASSWORD
MAIL_USERNAME = config.MAIL_USERNAME or SENDER_EMAIL

def send_email_smtp(recipient_email: str, subject: str, html_body: str):
    """
    Core function to send an email via SMTP.
    Runs inside FastAPI BackgroundTasks.
    """
    if not SENDER_PASSWORD:
        print("[EMAIL] ERROR: SENDER_PASSWORD not set. Cannot send email.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = recipient_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        # Use port 587 (STARTTLS) instead of 465 (SSL) to bypass cloud port blocking
        with smtplib.SMTP(SMTP_SERVER, 587, timeout=15) as server:
            server.ehlo()
            server.starttls()
            login_username = MAIL_USERNAME if MAIL_USERNAME else SENDER_EMAIL
            server.login(login_username, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
        print(f"[EMAIL] SUCCESS: Email sent to {recipient_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {recipient_email}: {e}")
        traceback.print_exc()

def send_login_alert_email(user_email: str, user_name: str):
    print(f"[EMAIL] send_login_alert_email START to={user_email!r} user_name={user_name!r}")
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
    send_email_smtp(user_email, subject, html_body)


def send_reset_code_email(user_email: str, otp: str):
    print(f"[EMAIL] send_reset_code_email START to={user_email!r} otp_len={len(otp)}")
    subject = "Your FindIt Reset Code"
    html_body = f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #003898; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0;">FindIt</h1>
    </div>
    <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
      <h2 style="color: #333;">Password Reset Code</h2>
      <p>You requested a password reset. Use the code below — it expires in <strong>15 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #003898;">{otp}</span>
      </div>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from FindIt. Do not reply.</p>
    </div>
  </body>
</html>
"""
    send_email_smtp(user_email, subject, html_body)


def send_welcome_email(user_email: str, user_name: str):
    print(f"[EMAIL] send_welcome_email START to={user_email!r} user_name={user_name!r}")
    name = user_name or "User"
    subject = "Welcome to Findit"
    html_body = f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #003898; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0;">Findit</h1>
    </div>
    <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
      <h2 style="color: #333;">Welcome, {name}!</h2>
      <p>Your account has been created. You can now report lost or found items and help others reunite with their belongings.</p>
      <p>If you did not create this account, please contact support.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from Findit. Please do not reply.</p>
    </div>
  </body>
</html>
"""
    send_email_smtp(user_email, subject, html_body)


def send_item_notification(user_email: str, user_name: str, item_title: str, item_id: int):
    print(f"[EMAIL] send_item_notification START to={user_email!r} item_id={item_id} title={item_title!r}")
    name = user_name or "User"
    subject = "Item reported — Findit"
    html_body = f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #003898; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0;">Findit</h1>
    </div>
    <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
      <h2 style="color: #333;">Item reported</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>Your item &quot;{item_title}&quot; has been successfully reported (ID: {item_id}). Others can now view it and claim if it belongs to them.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from Findit. Please do not reply.</p>
    </div>
  </body>
</html>
"""
    send_email_smtp(user_email, subject, html_body)


def send_registration_otp_email(user_email: str, otp: str):
    print(f"[EMAIL] send_registration_otp_email START to={user_email!r} otp_len={len(otp)}")
    subject = "Verify your FindIt Account"
    html_body = f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #003898; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; margin: 0;">FindIt</h1>
    </div>
    <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
      <h2 style="color: #333;">Verify Your Email</h2>
      <p>Please use the verification code below to activate your account. It expires in <strong>15 minutes</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #003898;">{otp}</span>
      </div>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from FindIt. Do not reply.</p>
    </div>
  </body>
</html>
"""
    send_email_smtp(user_email, subject, html_body)
