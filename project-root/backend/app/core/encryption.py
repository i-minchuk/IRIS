from cryptography.fernet import Fernet
from app.core.config import settings

_cipher = None


def get_cipher():
    global _cipher
    if _cipher is None:
        key = settings.ENCRYPTION_KEY or Fernet.generate_key()
        _cipher = Fernet(key)
    return _cipher


def encrypt(value: str) -> str:
    if not value:
        return value
    return get_cipher().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    if not value:
        return value
    return get_cipher().decrypt(value.encode()).decode()
