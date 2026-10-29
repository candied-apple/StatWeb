import pytest
from pathlib import Path
from app.storage.local import LocalStorageBackend


def test_local_storage_crud(tmp_path: Path):
    storage = LocalStorageBackend(tmp_path)

    key = "datasets/123e4567-e89b-12d3-a456-426614174000/data.csv"
    data = b"col1,col2\n1,2\n3,4"

    # Save
    saved_key = storage.save_bytes(key, data)
    assert saved_key == key
    assert storage.exists(key)

    # Read
    read_data = storage.read_bytes(key)
    assert read_data == data

    # Local path
    path = storage.get_local_path(key)
    assert path.is_file()
    assert path.read_bytes() == data

    # Delete
    assert storage.delete(key) is True
    assert not storage.exists(key)


def test_local_storage_traversal_prevention(tmp_path: Path):
    storage = LocalStorageBackend(tmp_path)

    with pytest.raises(ValueError, match="path traversal"):
        storage.save_bytes("../../etc/passwd", b"bad")

    with pytest.raises(ValueError, match="path traversal"):
        storage.read_bytes("../secret.txt")
