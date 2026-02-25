"""
Utils: send_login_alert delegates to email_service (Resend) for backward compatibility.
"""
from email_service import send_login_alert_email


def send_login_alert(email: str):
    """
    Sends a security alert email when a user successfully logs in.
    Delegates to Resend-based send_login_alert_email (runs in BackgroundTask).
    """
    send_login_alert_email(email, "User")
