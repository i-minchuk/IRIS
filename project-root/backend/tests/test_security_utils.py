"""Tests for security utilities."""
import pytest

from app.core.config import is_secure_secret_key
from app.core.security_utils import is_secure_secret_key as security_is_secure_secret_key


class TestIsSecureSecretKey:
    """Tests for is_secure_secret_key function."""

    @pytest.mark.parametrize("key", [
        None,
        "",
        "short",
        "1234567890123456789012345678901",  # 31 chars
    ])
    def test_too_short_or_empty(self, key):
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    @pytest.mark.parametrize("key", [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
        "admin",
        "root",
        "toor",
        "qwerty",
        "12345678",
        "SECRET",  # case-insensitive check
        "ADMIN",
        "QwErTy",
    ])
    def test_default_keys_rejected(self, key):
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    def test_only_uppercase_and_digits_fails(self):
        key = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456"
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    def test_only_lowercase_and_digits_fails(self):
        key = "abcdefghijklmnopqrstuvwxyz123456"
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    def test_only_uppercase_and_lowercase_fails(self):
        key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    def test_upper_lower_digit_special_passes(self):
        key = "MyS3cur3!KeyWithEnoughLength1234"
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_upper_lower_digit_passes(self):
        key = "MyS3cur3KeyWithEnoughLength12345"
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_upper_lower_special_passes(self):
        key = "MySecure!KeyWithEnoughLength!!!!"
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_lower_digit_special_passes(self):
        key = "my$3cur3_key_with_enough_length1"
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_upper_digit_special_passes(self):
        key = "MY$3CUR3_KEY_WITH_ENOUGH_LENGTH1"
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_exactly_three_categories_passes(self):
        # upper + lower + digit
        key = "Ab1" + "x" * 29
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True

    def test_only_two_categories_fails(self):
        # upper + lower only
        key = "AbcdefghIjklmnopqrstuvwxyzabcdef"
        assert is_secure_secret_key(key) is False
        assert security_is_secure_secret_key(key) is False

    def test_long_secure_key_passes(self):
        key = "aB1!" * 20
        assert is_secure_secret_key(key) is True
        assert security_is_secure_secret_key(key) is True
