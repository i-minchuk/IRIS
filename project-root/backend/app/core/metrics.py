from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# HTTP метрики
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# Бизнес метрики
active_users = Gauge('active_users', 'Number of active users')
documents_created = Counter('documents_created_total', 'Total documents created')

# DB метрики
db_connections = Gauge('db_connections', 'Active DB connections')


def get_metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
