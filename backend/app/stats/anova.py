"""
Standalone One-Way ANOVA Engine.

Pure Python module leveraging SciPy (scipy.stats.f_oneway).
Follows SPSS One-Way ANOVA reporting format.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence
import math
import numpy as np
import scipy.stats as stats


@dataclass
class AnovaGroupDescriptive:
    group_val: Any
    group_label: str
    n: int
    mean: float
    std_dev: float
    std_error: float
    ci_lower: float
    ci_upper: float
    minimum: float
    maximum: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "group_val": self.group_val,
            "group_label": self.group_label,
            "n": self.n,
            "mean": round(self.mean, 4),
            "std_dev": round(self.std_dev, 4),
            "std_error": round(self.std_error, 4),
            "ci_lower": round(self.ci_lower, 4),
            "ci_upper": round(self.ci_upper, 4),
            "minimum": round(self.minimum, 4),
            "maximum": round(self.maximum, 4),
        }


@dataclass
class AnovaTableRow:
    source: str  # "Between Groups", "Within Groups", "Total"
    sum_of_squares: float
    df: int
    mean_square: Optional[float]
    f_statistic: Optional[float]
    p_value: Optional[float]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source,
            "sum_of_squares": round(self.sum_of_squares, 4),
            "df": self.df,
            "mean_square": round(self.mean_square, 4) if self.mean_square is not None else None,
            "f_statistic": round(self.f_statistic, 4) if self.f_statistic is not None else None,
            "p_value": round(self.p_value, 5) if self.p_value is not None else None,
        }


@dataclass
class OneWayAnovaResult:
    dependent_var_name: str
    factor_var_name: str
    group_descriptives: List[AnovaGroupDescriptive]
    anova_table: List[AnovaTableRow]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dependent_var_name": self.dependent_var_name,
            "factor_var_name": self.factor_var_name,
            "group_descriptives": [g.to_dict() for g in self.group_descriptives],
            "anova_table": [r.to_dict() for r in self.anova_table],
            "warnings": self.warnings,
        }


def calculate_one_way_anova(
    dependent_series: Sequence[Any],
    factor_series: Sequence[Any],
    dependent_var_name: str,
    factor_var_name: str,
    factor_val_labels: Optional[Dict[str, str]] = None,
    dep_missing: Optional[Sequence[Any]] = None,
    factor_missing: Optional[Sequence[Any]] = None,
) -> OneWayAnovaResult:
    warnings: List[str] = []
    labels = factor_val_labels or {}
    d_miss = set(dep_missing or [])
    f_miss = set(factor_missing or [])

    grouped_data: Dict[Any, List[float]] = {}
    n_cases = min(len(dependent_series), len(factor_series))

    for i in range(n_cases):
        d_val = dependent_series[i]
        f_val = factor_series[i]

        if d_val is None or d_val in d_miss or f_val is None or f_val in f_miss:
            continue
        try:
            num = float(d_val)
            if math.isnan(num) or math.isinf(num):
                continue
            if f_val not in grouped_data:
                grouped_data[f_val] = []
            grouped_data[f_val].append(num)
        except (ValueError, TypeError):
            continue

    k = len(grouped_data)
    if k < 2:
        return OneWayAnovaResult(
            dependent_var_name=dependent_var_name,
            factor_var_name=factor_var_name,
            group_descriptives=[],
            anova_table=[],
            warnings=["One-Way ANOVA requires at least 2 distinct groups in the factor variable."],
        )

    # Sort groups
    try:
        sorted_groups = sorted(grouped_data.keys())
    except TypeError:
        sorted_groups = sorted(grouped_data.keys(), key=lambda x: str(x))

    arrays = [np.array(grouped_data[g], dtype=np.float64) for g in sorted_groups]
    total_n = sum(len(arr) for arr in arrays)
    all_data = np.concatenate(arrays)
    grand_mean = float(np.mean(all_data))

    # Group Descriptives
    descriptives: List[AnovaGroupDescriptive] = []
    ss_between = 0.0
    ss_within = 0.0

    for idx, g in enumerate(sorted_groups):
        arr = arrays[idx]
        n_g = len(arr)
        if n_g == 0:
            continue
        mean_g = float(np.mean(arr))
        std_g = float(np.std(arr, ddof=1)) if n_g > 1 else 0.0
        se_g = std_g / math.sqrt(n_g) if n_g > 0 else 0.0

        t_crit = stats.t.ppf(0.975, n_g - 1) if n_g > 1 else 1.96
        ci_lower = mean_g - t_crit * se_g
        ci_upper = mean_g + t_crit * se_g

        descriptives.append(
            AnovaGroupDescriptive(
                group_val=g,
                group_label=labels.get(str(g), str(g)),
                n=n_g,
                mean=mean_g,
                std_dev=std_g,
                std_error=se_g,
                ci_lower=ci_lower,
                ci_upper=ci_upper,
                minimum=float(np.min(arr)),
                maximum=float(np.max(arr)),
            )
        )

        ss_between += n_g * (mean_g - grand_mean) ** 2
        ss_within += float(np.sum((arr - mean_g) ** 2))

    df_between = k - 1
    df_within = total_n - k
    df_total = total_n - 1
    ss_total = ss_between + ss_within

    ms_between = ss_between / df_between if df_between > 0 else 0.0
    ms_within = ss_within / df_within if df_within > 0 else 0.0

    # SciPy f_oneway
    f_res = stats.f_oneway(*arrays)
    f_stat = float(f_res.statistic)
    p_val = float(f_res.pvalue)

    anova_table = [
        AnovaTableRow(
            source="Between Groups",
            sum_of_squares=ss_between,
            df=df_between,
            mean_square=ms_between,
            f_statistic=f_stat,
            p_value=p_val,
        ),
        AnovaTableRow(
            source="Within Groups",
            sum_of_squares=ss_within,
            df=df_within,
            mean_square=ms_within,
            f_statistic=None,
            p_value=None,
        ),
        AnovaTableRow(
            source="Total",
            sum_of_squares=ss_total,
            df=df_total,
            mean_square=None,
            f_statistic=None,
            p_value=None,
        ),
    ]

    return OneWayAnovaResult(
        dependent_var_name=dependent_var_name,
        factor_var_name=factor_var_name,
        group_descriptives=descriptives,
        anova_table=anova_table,
        warnings=warnings,
    )
