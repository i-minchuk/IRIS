# Developer Guide

## Getting Started

### Prerequisites
- Python 3.12
- Node.js 18+
- Docker
- Git

### Clone the repository
```bash
git clone https://github.com/your-username/iris.git
cd iris
```

### Setup Environment

#### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
.\.venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### Run the Application

#### Start Development Server
```bash
cd backend
uvicorn app.main:app --reload
```

```bash
cd frontend
npm run dev
```

### Run Tests

#### Backend
```bash
cd backend
pytest tests/
```

#### Frontend
```bash
cd frontend
npm run test:e2e
```

## Architecture

- **Backend**: FastAPI + SQLAlchemy + Pydantic v2
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (async)
- **Authentication**: JWT + OAuth2
- **Storage**: Local disk (configurable)
- **Search**: Qdrant
- **Caching**: Redis
- **Monitoring**: Prometheus + Grafana

## Deployment

- **Docker**: `docker-compose.yml`
- **Kubernetes**: `k8s/` directory
- **CI/CD**: GitHub Actions

## Security

- `SECRET_KEY` must be at least 32 characters long
- HTTPS required in production
- Rate limiting on auth endpoints
- HttpOnly, Secure, SameSite=Lax cookies

## Contributing

- Fork the repository
- Create a feature branch
- Write tests
- Submit a pull request

## Contact

- Tech Lead: @i-minchuk
- Documentation: `docs/`
- Issues: Open a GitHub issue