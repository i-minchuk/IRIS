import base64
import hashlib

from cryptography.fernet import Fernet
from app.core.config import settings

_cipher = None


def _derive_key() -> bytes:
    """Стабильный ключ: явный ENCRYPTION_KEY, иначе — производный от SECRET_KEY.

    Раньше при отсутствии ENCRYPTION_KEY ключ генерировался случайно на каждый
    старт процесса, и зашифрованные данные становились нечитаемыми после рестарта.
    """
    if settings.ENCRYPTION_KEY:
        return settings.ENCRYPTION_KEY.encode()
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def get_cipher():
    global _cipher
    if _cipher is None:
        _cipher = Fernet(_derive_key())
    return _cipher


def encrypt(value: str) -> str:
    if not value:
        return value
    return get_cipher().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    if not value:
        return value
    return get_cipher().decrypt(value.encode()).decode()
