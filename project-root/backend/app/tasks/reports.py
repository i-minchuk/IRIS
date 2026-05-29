from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def generate_report(self, report_type: str, params: dict):
    """Генерация отчёта указанного типа."""
    try:
        # TODO: реализовать логику генерации отчётов
        return {
            "status": "completed",
            "report_type": report_type,
            "url": "/reports/123.pdf",
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def export_data(self, model_name: str, format_type: str, filters: dict | None = None):
    """Экспорт данных модели в указанном формате (csv, xlsx, json)."""
    try:
        # TODO: реализовать экспорт данных
        return {
            "status": "completed",
            "model": model_name,
            "format": format_type,
            "url": f"/exports/{model_name}.{format_type}",
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
