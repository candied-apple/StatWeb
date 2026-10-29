"""
Storage abstraction interface.
Enables pluggable backends (Local filesystem for MVP, S3-compatible object storage later).
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import BinaryIO, Optional


class StorageBackend(ABC):
    """
    Abstract storage backend interface.
    Storage keys are abstract identifiers (e.g. UUID filenames), not raw filesystem paths.
    """

    @abstractmethod
    def save_bytes(self, key: str, data: bytes) -> str:
        """Saves raw byte content to storage key. Returns key."""
        pass

    @abstractmethod
    def save_stream(self, key: str, stream: BinaryIO) -> str:
        """Streams content to storage key. Returns key."""
        pass

    @abstractmethod
    def read_bytes(self, key: str) -> bytes:
        """Reads and returns entire content of storage key as bytes."""
        pass

    @abstractmethod
    def get_local_path(self, key: str) -> Path:
        """
        Returns local filesystem path for libraries (pyreadstat, pyarrow)
        that require a path or local file descriptor.
        """
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Checks if key exists in storage."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Deletes object at storage key. Returns True if deleted."""
        pass
