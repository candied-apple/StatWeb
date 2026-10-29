from datetime import datetime, timezone
import uuid
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_format: Mapped[str] = mapped_column(String(32), nullable=False)  # csv, xlsx, sav
    raw_storage_key: Mapped[str] = mapped_column(String(255), nullable=False)
    parquet_storage_key: Mapped[str] = mapped_column(String(255), nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    column_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    project = relationship("Project", back_populates="datasets")
    variables = relationship("Variable", back_populates="dataset", cascade="all, delete-orphan", order_by="Variable.column_index")
    analysis_runs = relationship("AnalysisRun", back_populates="dataset", cascade="all, delete-orphan")
