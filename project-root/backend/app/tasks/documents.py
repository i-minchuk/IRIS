from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def generate_pdf(self, document_id: int, template_name: str, params: dict):
    """Генерация PDF-документа по шаблону."""
    try:
        # TODO: реализовать генерацию PDF (например, через weasyprint или reportlab)
        return {
            "status": "completed",
            "document_id": document_id,
            "url": f"/storage/documents/{document_id}.pdf",
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def process_file(self, file_path: str, operation: str, options: dict | None = None):
    """Обработка загруженного файла (конвертация, извлечение текста и т.д.)."""
    try:
        # TODO: реализовать обработку файлов
        return {
            "status": "completed",
            "file_path": file_path,
            "operation": operation,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
