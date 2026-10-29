"""
Local filesystem storage implementation.
"""

from pathlib import Path
from typing import BinaryIO
import re
import shutil
from app.storage.base import StorageBackend


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_directory: Path):
        self.base_dir = Path(base_directory).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_safe_path(self, key: str) -> Path:
        """Guards against directory traversal and returns safe absolute path."""
        # Clean and validate key
        clean_key = key.replace("\\", "/").strip("/")
        if ".." in clean_key.split("/"):
            raise ValueError(f"Security error: Invalid storage key with path traversal attempt: {key}")

        safe_path = (self.base_dir / clean_key).resolve()
        if not str(safe_path).startswith(str(self.base_dir)):
            raise ValueError(f"Security error: Resolved path outside base directory: {key}")

        return safe_path

    def save_bytes(self, key: str, data: bytes) -> str:
        dest = self._resolve_safe_path(key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return key

    def save_stream(self, key: str, stream: BinaryIO) -> str:
        dest = self._resolve_safe_path(key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            shutil.copyfileobj(stream, f)
        return key

    def read_bytes(self, key: str) -> bytes:
        dest = self._resolve_safe_path(key)
        if not dest.is_file():
            raise FileNotFoundError(f"Storage key not found: {key}")
        return dest.read_bytes()

    def get_local_path(self, key: str) -> Path:
        dest = self._resolve_safe_path(key)
        if not dest.exists():
            raise FileNotFoundError(f"Storage key does not exist on disk: {key}")
        return dest

    def exists(self, key: str) -> bool:
        try:
            dest = self._resolve_safe_path(key)
            return dest.is_file()
        except ValueError:
            return False

    def delete(self, key: str) -> bool:
        dest = self._resolve_safe_path(key)
        if dest.is_file():
            dest.unlink()
            return True
        return False
