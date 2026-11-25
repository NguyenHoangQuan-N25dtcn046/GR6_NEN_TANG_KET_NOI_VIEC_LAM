"""Explicit, repeatable migration for existing job tables. Back up the DB first.
Run from back_end: python -m scripts.migrate_job_fields
"""
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import inspect, Column, String, Text, text


def upgrade(engine):
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "jobs" not in inspector.get_table_names():
            return
        columns = {c["name"]: c for c in inspector.get_columns("jobs")}
        if "True" in columns and "rejection_reason" in columns:
            raise RuntimeError("Both True and rejection_reason exist; reconcile data before migration")
        if "approval" in columns and "approval_status" in columns:
            raise RuntimeError("Both approval and approval_status exist; reconcile data before migration")
        operations = Operations(MigrationContext.configure(connection))
        added_approval = "approval" not in columns and "approval_status" not in columns
        added_job_status = "job_status" not in columns
        with operations.batch_alter_table("jobs") as batch:
            if "True" in columns:
                batch.alter_column("True", new_column_name="rejection_reason",
                                   existing_type=Text(), nullable=True)
            elif "rejection_reason" not in columns:
                batch.add_column(Column("rejection_reason", Text(), nullable=True))
            elif not columns["rejection_reason"]["nullable"]:
                batch.alter_column("rejection_reason", existing_type=Text(), nullable=True)
            if "approval_status" in columns:
                batch.alter_column("approval_status", new_column_name="approval",
                                   existing_type=String(20))
            elif added_approval:
                batch.add_column(Column("approval", String(20), nullable=False, server_default="pending"))
            if added_job_status:
                batch.add_column(Column("job_status", String(20), nullable=False, server_default="open"))
        if added_approval:
            connection.execute(text("""UPDATE jobs SET approval = CASE
                WHEN status IN ('published', 'closed') THEN 'approved'
                WHEN status = 'rejected' THEN 'rejected' ELSE 'pending' END"""))
        if added_job_status:
            connection.execute(text("""UPDATE jobs SET job_status = CASE
                WHEN status IN ('closed', 'rejected') THEN 'closed' ELSE 'open' END"""))


if __name__ == "__main__":
    from app.db.session import engine
    upgrade(engine)
    print("Job field migration completed")
