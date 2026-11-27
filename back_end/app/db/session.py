from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings
from sqlalchemy_utils import create_database, database_exists

class Base(DeclarativeBase):
    pass

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")


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
