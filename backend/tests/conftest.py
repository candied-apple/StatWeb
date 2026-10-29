import os
import tempfile
from pathlib import Path
import pytest

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://statweb:statweb_pass@localhost:5432/statweb_test"
)
os.environ["DATABASE_URL"] = TEST_DB_URL

# Isolate storage for tests to a temporary directory
test_storage_dir = tempfile.TemporaryDirectory()
from app.api import deps
from app.storage.local import LocalStorageBackend
deps._storage_instance = LocalStorageBackend(Path(test_storage_dir.name))

from sqlalchemy import create_engine
from app.db.base import Base

test_engine = create_engine(TEST_DB_URL)

@pytest.fixture(autouse=True)
def clean_db():
    """Ensure a clean database state for each test run."""
    with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield
