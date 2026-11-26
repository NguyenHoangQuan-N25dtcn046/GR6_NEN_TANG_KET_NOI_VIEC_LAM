"""Create an administrator without resetting existing application data."""

import argparse
from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, db_init, engine
from app.models.entities import User


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    args = parser.parse_args()
    try:
        email = TypeAdapter(EmailStr).validate_python(args.email).lower()
    except ValidationError:
        parser.error("Email không hợp lệ")

    password = getpass("Mật khẩu quản trị: ")
    if not 8 <= len(password) <= 128:
        parser.error("Mật khẩu phải có từ 8 đến 128 ký tự")
    if getpass("Nhập lại mật khẩu: ") != password:
        parser.error("Mật khẩu nhập lại không khớp")

    db_init()
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password(password), role="admin"))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            parser.error("Email đã được sử dụng")
    print("Admin account created.")


if __name__ == "__main__":
    main()
