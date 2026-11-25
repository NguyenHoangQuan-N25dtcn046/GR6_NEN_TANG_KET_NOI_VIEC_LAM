import pytest
from sqlalchemy import create_engine, text, inspect
from scripts.migrate_job_fields import upgrade


@pytest.mark.parametrize("legacy_fields", [False, True])
def test_migration_preserves_data_and_is_repeatable(legacy_fields):
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        extra = ', approval VARCHAR(20) NOT NULL, job_status VARCHAR(20) NOT NULL, "True" TEXT NOT NULL' if legacy_fields else ''
        conn.execute(text('CREATE TABLE jobs (id INTEGER PRIMARY KEY, status VARCHAR(20) NOT NULL' + extra + ')'))
        values = ", 'pending', 'open', 'existing reason'" if legacy_fields else ''
        conn.execute(text("INSERT INTO jobs VALUES (1, 'published'" + values + ')'))
    upgrade(engine)
    upgrade(engine)
    columns = {c['name']: c for c in inspect(engine).get_columns('jobs')}
    assert 'True' not in columns and columns['rejection_reason']['nullable']
    with engine.begin() as conn:
        row = conn.execute(text('SELECT * FROM jobs')).mappings().one()
        assert row['approval'] == ('pending' if legacy_fields else 'approved')
        assert row['rejection_reason'] == ('existing reason' if legacy_fields else None)
        conn.execute(text('UPDATE jobs SET rejection_reason = NULL'))
    engine.dispose()
