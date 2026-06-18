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
