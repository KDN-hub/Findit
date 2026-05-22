from celery import Celery
import resend
import os
import traceback
import config

celery_app = Celery("tasks", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

_raw_from = (config.MAIL_FROM or "").strip()
SENDER_EMAIL = _raw_from if _raw_from else "Findit <onboarding@resend.dev>"

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_task(self, to_email: str, subject: str, html_body: str):
    try:
        resend.api_key = os.getenv("RESEND_API_KEY")
        if not resend.api_key:
            print("[EMAIL] RESEND_API_KEY not set. Cannot send email.")
            return
            
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        })
        print(f"[EMAIL] SUCCESS: Email sent to {to_email}")
    except Exception as exc:
        print(f"[EMAIL ERROR] FAILED to send email to {to_email}. Retrying...")
        traceback.print_exc()
        raise self.retry(exc=exc)
