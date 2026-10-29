"""
StatWeb standalone statistical engine.
Pure Python module. Contains no web or ORM dependencies.
"""

from app.stats.descriptives import (
    VariableDescriptives,
    DescriptivesResult,
    calculate_variable_descriptives,
    compute_descriptives,
)

__all__ = [
    "VariableDescriptives",
    "DescriptivesResult",
    "calculate_variable_descriptives",
    "compute_descriptives",
]
