import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Integer, ForeignKey, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Variable(Base):
    __tablename__ = "variables"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    dataset_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    column_index: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    data_type: Mapped[str] = mapped_column(String(32), default="numeric", nullable=False)  # numeric, string, date, boolean
    measurement_level: Mapped[str] = mapped_column(String(32), default="scale", nullable=False)  # nominal, ordinal, scale
    role: Mapped[str] = mapped_column(String(32), default="input", nullable=False)  # input, target, both, none
    missing_values: Mapped[Optional[List[Any]]] = mapped_column(JSON, nullable=True)  # [999, -1]
    value_labels: Mapped[Optional[Dict[str, str]]] = mapped_column(JSON, nullable=True)  # {"1": "Male", "2": "Female"}
    display_width: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    decimals: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    dataset = relationship("Dataset", back_populates="variables")
