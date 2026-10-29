"""
Standalone Frequency Analysis Engine.

Pure Python module leveraging NumPy, SciPy, and collections.
Follows SPSS / R statistical reporting standards for categorical and discrete data.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence
import collections
import math
import numpy as np


@dataclass
class FrequencyCategory:
    value: Any
    label: str
    frequency: int
    percent: float
    valid_percent: Optional[float] = None
    cumulative_percent: Optional[float] = None
    is_missing: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self.value,
            "label": self.label,
            "frequency": self.frequency,
            "percent": self.percent,
            "valid_percent": self.valid_percent,
            "cumulative_percent": self.cumulative_percent,
            "is_missing": self.is_missing,
        }


@dataclass
class VariableFrequencies:
    variable_name: str
    n_valid: int
    n_missing: int
    total: int
    categories: List[FrequencyCategory]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variable_name": self.variable_name,
            "n_valid": self.n_valid,
            "n_missing": self.n_missing,
            "total": self.total,
            "categories": [c.to_dict() for c in self.categories],
            "warnings": self.warnings,
        }


@dataclass
class FrequenciesResult:
    variables: List[VariableFrequencies]
    total_observations: int
    options: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variables": [v.to_dict() for v in self.variables],
            "total_observations": self.total_observations,
            "options": self.options,
        }


def calculate_variable_frequencies(
    series: Sequence[Any],
    variable_name: str,
    value_labels: Optional[Dict[str, str]] = None,
    user_missing_values: Optional[Sequence[Any]] = None,
) -> VariableFrequencies:
    """
    Computes frequency distribution, percentages, valid percentages,
    and cumulative percentages matching SPSS output.
    """
    warnings: List[str] = []
    labels_map = value_labels or {}
    missing_codes = set(user_missing_values or [])

    total_count = len(series)
    if total_count == 0:
        return VariableFrequencies(
            variable_name=variable_name,
            n_valid=0,
            n_missing=0,
            total=0,
            categories=[],
            warnings=["Series contains no observations."],
        )

    valid_counts: Dict[Any, int] = collections.defaultdict(int)
    missing_counts: Dict[Any, int] = collections.defaultdict(int)

    for item in series:
        # Check system missing
        if item is None:
            missing_counts["System Missing"] += 1
            continue
        if isinstance(item, float) and (math.isnan(item) or math.isinf(item)):
            missing_counts["System Missing"] += 1
            continue
        # Check user missing
        if item in missing_codes:
            missing_counts[item] += 1
            continue
        valid_counts[item] += 1

    n_valid = sum(valid_counts.values())
    n_missing = sum(missing_counts.values())

    categories: List[FrequencyCategory] = []

    # Sort valid values: attempt numeric sort, fallback to string sort
    try:
        sorted_valid = sorted(valid_counts.keys())
    except TypeError:
        sorted_valid = sorted(valid_counts.keys(), key=lambda x: str(x))

    cum_sum = 0.0
    for val in sorted_valid:
        count = valid_counts[val]
        raw_pct = round((count / total_count) * 100.0, 2)
        valid_pct = round((count / n_valid) * 100.0, 2) if n_valid > 0 else 0.0
        cum_sum += valid_pct

        # Label resolution
        label = labels_map.get(str(val))
        if not label:
            # Check integer representation if float
            if isinstance(val, float) and val.is_integer():
                label = labels_map.get(str(int(val)))
        if not label:
            label = str(val)

        categories.append(
            FrequencyCategory(
                value=val,
                label=label,
                frequency=count,
                percent=raw_pct,
                valid_percent=valid_pct,
                cumulative_percent=round(min(100.0, cum_sum), 2),
                is_missing=False,
            )
        )

    # Missing categories
    for miss_val, count in missing_counts.items():
        raw_pct = round((count / total_count) * 100.0, 2)
        label = f"User Missing ({miss_val})" if miss_val != "System Missing" else "System Missing"
        categories.append(
            FrequencyCategory(
                value=str(miss_val),
                label=label,
                frequency=count,
                percent=raw_pct,
                valid_percent=None,
                cumulative_percent=None,
                is_missing=True,
            )
        )

    if n_valid == 0:
        warnings.append("No valid cases available for frequency calculation.")

    return VariableFrequencies(
        variable_name=variable_name,
        n_valid=n_valid,
        n_missing=n_missing,
        total=total_count,
        categories=categories,
        warnings=warnings,
    )


def compute_frequencies(
    data: Dict[str, Sequence[Any]],
    variable_names: List[str],
    value_labels: Optional[Dict[str, Dict[str, str]]] = None,
    user_missing: Optional[Dict[str, Sequence[Any]]] = None,
    options: Optional[Dict[str, Any]] = None,
) -> FrequenciesResult:
    val_labels_map = value_labels or {}
    missing_map = user_missing or {}
    results: List[VariableFrequencies] = []
    total_obs = 0

    for name in variable_names:
        series = data.get(name, [])
        if len(series) > total_obs:
            total_obs = len(series)
        var_res = calculate_variable_frequencies(
            series=series,
            variable_name=name,
            value_labels=val_labels_map.get(name),
            user_missing_values=missing_map.get(name),
        )
        results.append(var_res)

    return FrequenciesResult(
        variables=results,
        total_observations=total_obs,
        options=options or {},
    )
