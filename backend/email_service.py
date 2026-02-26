"""
Email sending via Resend API (works on Render free tier; no SMTP ports 25/465/587).
Uses RESEND_API_KEY from environment. Designed to run in FastAPI BackgroundTasks.
Use onboarding@resend.dev as From until you have a verified domain in Resend.
"""
import os
import traceback
import resend
import config  # for MAIL_FROM

# API key from environment (required for Resend)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
# From: use MAIL_FROM only if set (verified domain); otherwise Resend requires onboarding@resend.dev
_raw_from = (config.MAIL_FROM or "").strip()
SENDER_EMAIL = _raw_from if _raw_from else "Findit <onboarding@resend.dev>"
print(f"[EMAIL] Sender (From) address: {SENDER_EMAIL!r} (use onboarding@resend.dev if no verified domain)")


def send_login_alert_email(user_email: str, user_name: str):
    """
    Sends a security alert email on successful login.
    Designed to run as a FastAPI BackgroundTask so it won't block the response.
    """
    print(f"[EMAIL] send_login_alert_email START to={user_email!r} user_name={user_name!r}")
    if not RESEND_API_KEY:
        print("[EMAIL] send_login_alert_email ABORT: RESEND_API_KEY not set; skipping login alert.")
        return
    print(f"[EMAIL] send_login_alert_email Using From: {SENDER_EMAIL!r}")
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
    try:
        print("[EMAIL] send_login_alert_email Setting resend.api_key")
        resend.api_key = RESEND_API_KEY
        print("[EMAIL] send_login_alert_email Calling Resend API (Emails.send)...")
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": subject,
            "html": html_body,
        })
        print(f"[EMAIL] send_login_alert_email SUCCESS: login alert sent to {user_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] send_login_alert_email FAILED to {user_email}: {e!r}")
        traceback.print_exc()


def send_reset_code_email(user_email: str, otp: str):
    """
    Sends the password reset OTP email via Resend.
    Safe to run in a BackgroundTask; logs errors without raising.
    """
    print(f"[EMAIL] send_reset_code_email START to={user_email!r} otp_len={len(otp)}")
    if not RESEND_API_KEY:
        print("[EMAIL] send_reset_code_email ABORT: RESEND_API_KEY not set; cannot send reset code.")
        return
    print(f"[EMAIL] send_reset_code_email Using From: {SENDER_EMAIL!r}")
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
    try:
        print("[EMAIL] send_reset_code_email Setting resend.api_key")
        resend.api_key = RESEND_API_KEY
        print("[EMAIL] send_reset_code_email Calling Resend API (Emails.send)...")
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": subject,
            "html": html_body,
        })
        print(f"[EMAIL] send_reset_code_email SUCCESS: reset code sent to {user_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] send_reset_code_email FAILED to {user_email}: {e!r}")
        traceback.print_exc()


def send_welcome_email(user_email: str, user_name: str):
    """
    Sends a welcome email after signup. Safe to run in a BackgroundTask.
    """
    print(f"[EMAIL] send_welcome_email START to={user_email!r} user_name={user_name!r}")
    if not RESEND_API_KEY:
        print("[EMAIL] send_welcome_email ABORT: RESEND_API_KEY not set; skipping welcome email.")
        return
    print(f"[EMAIL] send_welcome_email Using From: {SENDER_EMAIL!r}")
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
    try:
        print("[EMAIL] send_welcome_email Setting resend.api_key")
        resend.api_key = RESEND_API_KEY
        print("[EMAIL] send_welcome_email Calling Resend API (Emails.send)...")
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": subject,
            "html": html_body,
        })
        print(f"[EMAIL] send_welcome_email SUCCESS: welcome email sent to {user_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] send_welcome_email FAILED to {user_email}: {e!r}")
        traceback.print_exc()


def send_item_notification(user_email: str, user_name: str, item_title: str, item_id: int):
    """
    Sends a confirmation email after reporting an item. Safe to run in a BackgroundTask.
    """
    print(f"[EMAIL] send_item_notification START to={user_email!r} item_id={item_id} title={item_title!r}")
    if not RESEND_API_KEY:
        print("[EMAIL] send_item_notification ABORT: RESEND_API_KEY not set; skipping item notification.")
        return
    print(f"[EMAIL] send_item_notification Using From: {SENDER_EMAIL!r}")
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
    try:
        print("[EMAIL] send_item_notification Setting resend.api_key")
        resend.api_key = RESEND_API_KEY
        print("[EMAIL] send_item_notification Calling Resend API (Emails.send)...")
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": subject,
            "html": html_body,
        })
        print(f"[EMAIL] send_item_notification SUCCESS: item notification sent to {user_email} for item #{item_id}")
    except Exception as e:
        print(f"[EMAIL ERROR] send_item_notification FAILED to {user_email}: {e!r}")
        traceback.print_exc()
