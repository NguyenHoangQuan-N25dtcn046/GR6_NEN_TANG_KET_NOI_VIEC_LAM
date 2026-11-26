from unicodedata import combining, normalize

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings
from sqlalchemy_utils import create_database, database_exists

class Base(DeclarativeBase):
    pass

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)


def normalize_search_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = normalize("NFD", value.casefold()).replace("đ", "d")
    return "".join(character for character in text if not combining(character))


def configure_sqlite_connection(connection, _):
    connection.execute("PRAGMA foreign_keys=ON")
    connection.create_function("job_search_text", 1, normalize_search_text, deterministic=True)


if engine.dialect.name == "sqlite":
    event.listen(engine, "connect", configure_sqlite_connection)


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def db_init():
    if not database_exists(engine.url):
        create_database(engine.url)
