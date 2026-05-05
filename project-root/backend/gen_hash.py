from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "admin123"
hash = pwd_context.hash(password)
print(f"Password: {password}")
print(f"Hash: {hash}")
