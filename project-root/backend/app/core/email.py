import asyncio
import logging
import smtplib
from email.mime.text import MIMEText
from email.header import Header

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings

logger = logging.getLogger(__name__)

sg = SendGridAPIClient(settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None


def email_configured() -> bool:
    """True, если настроен хотя бы один транспорт отправки писем."""
    return bool(settings.SENDGRID_API_KEY or settings.SMTP_HOST)


def _send_via_smtp(to: str, subject: str, html_content: str) -> int:
    msg = MIMEText(html_content, "html", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
        server.sendmail(settings.FROM_EMAIL, [to], msg.as_string())
    return 200


async def send_email(
    to: str, subject: str, html_content: str, text_content: str | None = None
) -> int | None:
    """Отправка письма. SendGrid (если задан ключ) или SMTP (если задан SMTP_HOST).

    Возвращает HTTP-статус отправки или None, если почта не настроена —
    тогда письмо только пишется в лог.
    """
    if not email_configured():
        logger.warning("[EMAIL MOCK] To: %s, Subject: %s", to, subject)
        return None

    if sg:
        message = Mail(
            from_email=settings.FROM_EMAIL,
            to_emails=to,
            subject=subject,
            html_content=html_content,
            plain_text_content=text_content,
        )
        response = await asyncio.to_thread(sg.send, message)
        return response.status_code

    return await asyncio.to_thread(_send_via_smtp, to, subject, html_content)


async def send_password_reset_email(to: str, reset_link: str, expires_minutes: int = 30) -> int | None:
    """Письмо со ссылкой на сброс пароля."""
    subject = "Восстановление пароля — ДокПоток IRIS"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #3B4FA8;">Восстановление пароля</h2>
      <p>Вы запросили сброс пароля в системе ДокПоток IRIS.</p>
      <p>Нажмите кнопку ниже, чтобы задать новый пароль:</p>
      <p style="margin: 24px 0;">
        <a href="{reset_link}"
           style="background: #3B4FA8; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Сбросить пароль
        </a>
      </p>
      <p style="color: #6B7280; font-size: 13px;">
        Ссылка действительна {expires_minutes} минут. Если вы не запрашивали
        восстановление пароля, просто проигнорируйте это письмо.
      </p>
      <p style="color: #6B7280; font-size: 12px;">
        Если кнопка не работает, скопируйте ссылку в браузер:<br/>
        <a href="{reset_link}">{reset_link}</a>
      </p>
    </div>
    """
    return await send_email(to, subject, html)


async def send_notification_email(
    user_email: str, notification_type: str, data: dict
) -> int | None:
    templates = {
    "workflow_started": {
        "subject": "Новый маршрут согласования",
        "html": "<h1>Вам назначен маршрут согласования</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p><p>Срок: {deadline_hours} ч</p>",
    },
    "step_assigned": {
        "subject": "Новый этап согласования",
        "html": "<h1>Вам назначен этап согласования</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p><p>Срок: {deadline_hours} ч</p>",
    },
    "step_approved": {
        "subject": "Этап согласован",
        "html": "<h1>Этап согласован</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p>",
    },
    "step_rejected": {
        "subject": "Отказ в согласовании",
        "html": "<h1>Отказ в согласовании</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p><p>Причина: {reason}</p>",
    },
    "step_rejected_return": {
        "subject": "Возврат на доработку",
        "html": "<h1>Этап возвращён на доработку</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p><p>Причина: {reason}</p>",
    },
    "step_delegated": {
        "subject": "Делегирование этапа",
        "html": "<h1>Вам делегирован этап согласования</h1><p>Документ: {document_name}</p><p>Этап: {step_name}</p><p>Причина: {reason}</p>",
    },
    "workflow_completed": {
        "subject": "Маршрут согласования завершён",
        "html": "<h1>Маршрут согласования завершён</h1><p>Документ: {document_name}</p><p>Все этапы пройдены.</p>",
    },
    }
    template = templates.get(
        notification_type,
        {"subject": "Уведомление", "html": "<p>Новое уведомление</p>"},
    )
    # Format template strings with data
    subject = template["subject"].format(**data)
    html = template["html"].format(**data)
    return await send_email(user_email, subject, html)
