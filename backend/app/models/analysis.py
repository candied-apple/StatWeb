from datetime import datetime, timezone
import uuid
from typing import Optional, Dict, Any
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    dataset_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_type: Mapped[str] = mapped_column(String(64), nullable=False)  # descriptives, frequencies, etc.
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parameters: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    results: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False)  # pending, completed, failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    dataset = relationship("Dataset", back_populates="analysis_runs")
