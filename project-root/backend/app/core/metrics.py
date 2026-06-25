# Re-export metrics from monitoring module (single source of truth)
from app.modules.monitoring.router import (
    http_requests_total,
    http_request_duration_seconds as http_request_duration,
)

def get_metrics():
    from fastapi import Response
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Бизнес метрики (unique to this module)
from prometheus_client import Counter, Gauge
documents_created = Counter('documents_created_total', 'Total documents created')
db_connections = Gauge('db_connections', 'Active DB connections')
