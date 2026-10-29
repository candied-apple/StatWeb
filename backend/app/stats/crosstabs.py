"""
Standalone Cross-tabulation and Chi-Square Engine.

Pure Python module leveraging SciPy (scipy.stats.chi2_contingency).
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple
import math
import numpy as np
import scipy.stats as stats


@dataclass
class CrosstabCell:
    row_val: Any
    col_val: Any
    count: int
    row_percent: float
    col_percent: float
    total_percent: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row_val": self.row_val,
            "col_val": self.col_val,
            "count": self.count,
            "row_percent": self.row_percent,
            "col_percent": self.col_percent,
            "total_percent": self.total_percent,
        }


@dataclass
class ChiSquareStatistic:
    test_name: str
    value: float
    df: int
    p_value: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_name": self.test_name,
            "value": round(self.value, 4),
            "df": self.df,
            "p_value": round(self.p_value, 5),
        }


@dataclass
class EffectSizeMeasure:
    name: str
    value: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": round(self.value, 4),
        }


@dataclass
class CrosstabResult:
    row_var_name: str
    col_var_name: str
    row_categories: List[Dict[str, Any]]
    col_categories: List[Dict[str, Any]]
    cells: List[CrosstabCell]
    row_totals: Dict[str, int]
    col_totals: Dict[str, int]
    n_valid: int
    n_missing: int
    chi_square_tests: List[ChiSquareStatistic]
    effect_sizes: List[EffectSizeMeasure]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row_var_name": self.row_var_name,
            "col_var_name": self.col_var_name,
            "row_categories": self.row_categories,
            "col_categories": self.col_categories,
            "cells": [c.to_dict() for c in self.cells],
            "row_totals": self.row_totals,
            "col_totals": self.col_totals,
            "n_valid": self.n_valid,
            "n_missing": self.n_missing,
            "chi_square_tests": [t.to_dict() for t in self.chi_square_tests],
            "effect_sizes": [e.to_dict() for e in self.effect_sizes],
            "warnings": self.warnings,
        }


def calculate_crosstab(
    row_series: Sequence[Any],
    col_series: Sequence[Any],
    row_var_name: str,
    col_var_name: str,
    row_val_labels: Optional[Dict[str, str]] = None,
    col_val_labels: Optional[Dict[str, str]] = None,
    row_missing_values: Optional[Sequence[Any]] = None,
    col_missing_values: Optional[Sequence[Any]] = None,
) -> CrosstabResult:
    warnings: List[str] = []
    row_labels = row_val_labels or {}
    col_labels = col_val_labels or {}
    row_miss = set(row_missing_values or [])
    col_miss = set(col_missing_values or [])

    n_total = min(len(row_series), len(col_series))

    # Filter valid pairs
    valid_pairs: List[Tuple[Any, Any]] = []
    missing_count = 0

    for i in range(n_total):
        r_val = row_series[i]
        c_val = col_series[i]

        is_r_missing = (
            r_val is None
            or r_val in row_miss
            or (isinstance(r_val, float) and (math.isnan(r_val) or math.isinf(r_val)))
        )
        is_c_missing = (
            c_val is None
            or c_val in col_miss
            or (isinstance(c_val, float) and (math.isnan(c_val) or math.isinf(c_val)))
        )

        if is_r_missing or is_c_missing:
            missing_count += 1
        else:
            valid_pairs.append((r_val, c_val))

    n_valid = len(valid_pairs)
    if n_valid == 0:
        return CrosstabResult(
            row_var_name=row_var_name,
            col_var_name=col_var_name,
            row_categories=[],
            col_categories=[],
            cells=[],
            row_totals={},
            col_totals={},
            n_valid=0,
            n_missing=missing_count,
            chi_square_tests=[],
            effect_sizes=[],
            warnings=["No valid case pairs available for cross-tabulation."],
        )

    # Distinct categories
    try:
        unique_rows = sorted(list({r for r, _ in valid_pairs}))
    except TypeError:
        unique_rows = sorted(list({r for r, _ in valid_pairs}), key=lambda x: str(x))

    try:
        unique_cols = sorted(list({c for _, c in valid_pairs}))
    except TypeError:
        unique_cols = sorted(list({c for _, c in valid_pairs}), key=lambda x: str(x))

    # Cell counts
    matrix_counts = np.zeros((len(unique_rows), len(unique_cols)), dtype=int)
    row_map = {val: idx for idx, val in enumerate(unique_rows)}
    col_map = {val: idx for idx, val in enumerate(unique_cols)}

    for r, c in valid_pairs:
        matrix_counts[row_map[r], col_map[c]] += 1

    row_sums = np.sum(matrix_counts, axis=1)
    col_sums = np.sum(matrix_counts, axis=0)

    # Build cells
    cells: List[CrosstabCell] = []
    for r_idx, r_val in enumerate(unique_rows):
        r_total = row_sums[r_idx]
        for c_idx, c_val in enumerate(unique_cols):
            c_total = col_sums[c_idx]
            count = int(matrix_counts[r_idx, c_idx])
            row_pct = round((count / r_total) * 100.0, 2) if r_total > 0 else 0.0
            col_pct = round((count / c_total) * 100.0, 2) if c_total > 0 else 0.0
            tot_pct = round((count / n_valid) * 100.0, 2) if n_valid > 0 else 0.0

            cells.append(
                CrosstabCell(
                    row_val=r_val,
                    col_val=c_val,
                    count=count,
                    row_percent=row_pct,
                    col_percent=col_pct,
                    total_percent=tot_pct,
                )
            )

    # Category metadata with labels
    row_cats = [
        {"value": v, "label": row_labels.get(str(v), str(v))} for v in unique_rows
    ]
    col_cats = [
        {"value": v, "label": col_labels.get(str(v), str(v))} for v in unique_cols
    ]

    row_totals_dict = {str(unique_rows[i]): int(row_sums[i]) for i in range(len(unique_rows))}
    col_totals_dict = {str(unique_cols[j]): int(col_sums[j]) for j in range(len(unique_cols))}

    # Chi-Square Tests
    chi_square_tests: List[ChiSquareStatistic] = []
    effect_sizes: List[EffectSizeMeasure] = []

    if len(unique_rows) >= 2 and len(unique_cols) >= 2:
        try:
            # SciPy chi2_contingency wraps Pearson's chi-square test
            res = stats.chi2_contingency(matrix_counts, correction=False)
            chi2_stat = float(res.statistic)
            p_val = float(res.pvalue)
            dof = int(res.dof)

            chi_square_tests.append(
                ChiSquareStatistic(
                    test_name="Pearson Chi-Square",
                    value=chi2_stat,
                    df=dof,
                    p_value=p_val,
                )
            )

            # Check expected frequencies < 5
            exp_freqs = res.expected_freq
            small_exp_cells = np.sum(exp_freqs < 5)
            total_cells = exp_freqs.size
            if small_exp_cells > 0:
                pct_small = round((small_exp_cells / total_cells) * 100.0, 1)
                warnings.append(
                    f"{small_exp_cells} cells ({pct_small}%) have expected count less than 5. The minimum expected count is {np.min(exp_freqs):.2f}."
                )

            # Effect Size: Phi and Cramer's V
            k = min(len(unique_rows) - 1, len(unique_cols) - 1)
            if n_valid > 0 and k > 0:
                cramers_v = math.sqrt(chi2_stat / (n_valid * k))
                effect_sizes.append(EffectSizeMeasure(name="Cramer's V", value=cramers_v))
                if len(unique_rows) == 2 and len(unique_cols) == 2:
                    phi = math.sqrt(chi2_stat / n_valid)
                    effect_sizes.append(EffectSizeMeasure(name="Phi", value=phi))

        except Exception as e:
            warnings.append(f"Chi-square computation warning: {str(e)}")
    else:
        warnings.append("Chi-square requires at least 2 rows and 2 columns.")

    return CrosstabResult(
        row_var_name=row_var_name,
        col_var_name=col_var_name,
        row_categories=row_cats,
        col_categories=col_cats,
        cells=cells,
        row_totals=row_totals_dict,
        col_totals=col_totals_dict,
        n_valid=n_valid,
        n_missing=missing_count,
        chi_square_tests=chi_square_tests,
        effect_sizes=effect_sizes,
        warnings=warnings,
    )
