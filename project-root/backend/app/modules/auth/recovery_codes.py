"""2FA recovery codes — generate and verify backup codes for account recovery."""
from __future__ import annotations

import secrets
import hashlib
from typing import List, Set


def generate_recovery_codes(count: int = 10) -> List[str]:
    """Generate random recovery codes (8-digit alphanumeric)."""
    codes = []
    for _ in range(count):
        # 8-digit code: 4 chars + 4 chars, separated by hyphen
        part1 = secrets.token_hex(2).upper()  # 4 hex chars
        part2 = secrets.token_hex(2).upper()
        codes.append(f"{part1}-{part2}")
    return codes


def hash_recovery_codes(codes: List[str]) -> List[str]:
    """Hash recovery codes for storage (SHA256)."""
    return [hashlib.sha256(code.encode()).hexdigest() for code in codes]


def verify_recovery_code(plain_code: str, hashed_codes: List[str]) -> bool:
    """Verify a recovery code against hashed codes."""
    code_hash = hashlib.sha256(plain_code.encode()).hexdigest()
    return code_hash in hashed_codes


def consume_recovery_code(plain_code: str, hashed_codes: List[str]) -> List[str]:
    """Remove a used recovery code from the list."""
    code_hash = hashlib.sha256(plain_code.encode()).hexdigest()
    return [h for h in hashed_codes if h != code_hash]
