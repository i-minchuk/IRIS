from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import settings

sg = SendGridAPIClient(settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None


async def send_email(
    to: str, subject: str, html_content: str, text_content: str | None = None
) -> int | None:
    if not sg:
        print(f"[EMAIL MOCK] To: {to}, Subject: {subject}")
        return None

    message = Mail(
        from_email=settings.FROM_EMAIL,
        to_emails=to,
        subject=subject,
        html_content=html_content,
        plain_text_content=text_content,
    )
    response = sg.send(message)
    return response.status_code


async def send_notification_email(
    user_email: str, notification_type: str, data: dict
) -> int | None:
    templates = {
        "task_assigned": {
            "subject": "Новая задача",
            "html": f"<h1>Вам назначена задача</h1><p>{data.get('task_title')}</p>",
        },
        "deadline_approaching": {
            "subject": "Приближается дедлайн",
            "html": f"<h1>Дедлайн через {data.get('days')} дней</h1>",
        },
    }
    template = templates.get(
        notification_type,
        {"subject": "Уведомление", "html": "<p>Новое уведомление</p>"},
    )
    return await send_email(user_email, template["subject"], template["html"])
