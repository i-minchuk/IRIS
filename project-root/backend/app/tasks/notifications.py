from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body: str, html: str | None = None):
    """Отправка email-уведомления."""
    try:
        # TODO: интегрировать с SMTP или email-сервисом
        return {
            "status": "completed",
            "recipient": to,
            "subject": subject,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_push(self, user_id: int, title: str, message: str, data: dict | None = None):
    """Отправка push-уведомления пользователю."""
    try:
        # TODO: интегрировать с push-сервисом (FCM, WebPush и т.д.)
        return {
            "status": "completed",
            "user_id": user_id,
            "title": title,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def notify_project_members(self, project_id: int, event: str, payload: dict):
    """Массовое уведомление участников проекта о событии."""
    try:
        # TODO: получить участников проекта и разослать уведомления
        return {
            "status": "completed",
            "project_id": project_id,
            "event": event,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
