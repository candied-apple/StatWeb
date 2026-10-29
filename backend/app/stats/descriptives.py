"""
Standalone Descriptive Statistics Engine.

Pure Python module leveraging NumPy and SciPy.
Follows SPSS / R statistical formulas and reporting standards.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Union
import math
import numpy as np
import scipy.stats as stats


@dataclass
class VariableDescriptives:
    variable_name: str
    n_valid: int
    n_missing: int
    mean: Optional[float] = None
    std_error_mean: Optional[float] = None
    median: Optional[float] = None
    mode: Optional[float] = None
    std_dev: Optional[float] = None
    variance: Optional[float] = None
    skewness: Optional[float] = None
    std_error_skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    std_error_kurtosis: Optional[float] = None
    range_val: Optional[float] = None
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    sum_val: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variable_name": self.variable_name,
            "n_valid": self.n_valid,
            "n_missing": self.n_missing,
            "mean": self.mean,
            "std_error_mean": self.std_error_mean,
            "median": self.median,
            "mode": self.mode,
            "std_dev": self.std_dev,
            "variance": self.variance,
            "skewness": self.skewness,
            "std_error_skewness": self.std_error_skewness,
            "kurtosis": self.kurtosis,
            "std_error_kurtosis": self.std_error_kurtosis,
            "range": self.range_val,
            "minimum": self.minimum,
            "maximum": self.maximum,
            "sum": self.sum_val,
            "q1": self.q1,
            "q3": self.q3,
            "iqr": self.iqr,
            "warnings": self.warnings,
        }


@dataclass
class DescriptivesResult:
    variables: List[VariableDescriptives]
    total_observations: int
    options: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variables": [v.to_dict() for v in self.variables],
            "total_observations": self.total_observations,
            "options": self.options,
        }


def _calculate_se_skewness(n: int) -> Optional[float]:
    """SPSS formula for standard error of skewness."""
    if n < 3:
        return None
    val = (6.0 * n * (n - 1.0)) / ((n - 2.0) * (n + 1.0) * (n + 3.0))
    return math.sqrt(val) if val > 0 else None


def _calculate_se_kurtosis(n: int, se_skew: Optional[float]) -> Optional[float]:
    """SPSS formula for standard error of kurtosis."""
    if n < 4 or se_skew is None:
        return None
    val = ((n**2 - 1.0) / ((n - 3.0) * (n + 5.0)))
    if val <= 0:
        return None
    return 2.0 * se_skew * math.sqrt(val)


def calculate_variable_descriptives(
    series: Sequence[Any],
    variable_name: str,
    user_missing_values: Optional[Sequence[Any]] = None,
) -> VariableDescriptives:
    """
    Computes univariate descriptive statistics for a numeric sequence.
    Handles NaN, None, and user-defined missing codes.
    Wraps SciPy / NumPy without reimplementing core mathematical tests.
    """
    warnings: List[str] = []
    missing_codes = set(user_missing_values or [])

    # Filter valid numbers
    valid_data: List[float] = []
    missing_count = 0

    for item in series:
        if item is None:
            missing_count += 1
            continue
        if item in missing_codes:
            missing_count += 1
            continue
        try:
            val = float(item)
            if math.isnan(val) or math.isinf(val):
                missing_count += 1
            else:
                valid_data.append(val)
        except (ValueError, TypeError):
            missing_count += 1

    n_valid = len(valid_data)

    if n_valid == 0:
        warnings.append("No valid numeric observations found.")
        return VariableDescriptives(
            variable_name=variable_name,
            n_valid=0,
            n_missing=missing_count,
            warnings=warnings,
        )

    arr = np.array(valid_data, dtype=np.float64)
    mean_val = float(np.mean(arr))
    sum_val = float(np.sum(arr))
    min_val = float(np.min(arr))
    max_val = float(np.max(arr))
    range_val = float(max_val - min_val)
    median_val = float(np.median(arr))

    # Mode using scipy.stats
    mode_res = stats.mode(arr, keepdims=False)
    mode_val = float(mode_res.mode)

    # Standard deviation & variance (sample: ddof=1)
    std_val: Optional[float] = None
    var_val: Optional[float] = None
    se_mean: Optional[float] = None

    if n_valid >= 2:
        std_val = float(np.std(arr, ddof=1))
        var_val = float(np.var(arr, ddof=1))
        se_mean = float(std_val / math.sqrt(n_valid))
        if std_val == 0.0:
            warnings.append("Variable is constant (variance is zero).")
    else:
        warnings.append("Sample size N=1 is insufficient to compute sample variance or standard deviation.")

    # Skewness & Kurtosis (unbiased / sample-adjusted matching SPSS and R e1071 type 2)
    skew_val: Optional[float] = None
    se_skew: Optional[float] = None
    kurt_val: Optional[float] = None
    se_kurt: Optional[float] = None

    if n_valid >= 3:
        if std_val and std_val > 0.0:
            skew_val = float(stats.skew(arr, bias=False))
            se_skew = _calculate_se_skewness(n_valid)
        else:
            warnings.append("Cannot compute skewness on constant data.")
    else:
        warnings.append("Sample size N < 3 is insufficient to compute sample-adjusted skewness.")

    if n_valid >= 4:
        if std_val and std_val > 0.0:
            kurt_val = float(stats.kurtosis(arr, bias=False))  # Excess kurtosis
            se_kurt = _calculate_se_kurtosis(n_valid, se_skew)
        else:
            warnings.append("Cannot compute kurtosis on constant data.")
    else:
        warnings.append("Sample size N < 4 is insufficient to compute sample-adjusted kurtosis.")

    # Quartiles (SPSS / R default quantile method - method='weibull' or 'linear')
    # Default np.percentile with method='weibull' matches SPSS Type 6, 'linear' matches Type 7 (R default).
    # We use linear by default (Type 7 / standard SciPy/NumPy).
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    iqr = float(q3 - q1)

    return VariableDescriptives(
        variable_name=variable_name,
        n_valid=n_valid,
        n_missing=missing_count,
        mean=round(mean_val, 6) if mean_val is not None else None,
        std_error_mean=round(se_mean, 6) if se_mean is not None else None,
        median=round(median_val, 6) if median_val is not None else None,
        mode=round(mode_val, 6) if mode_val is not None else None,
        std_dev=round(std_val, 6) if std_val is not None else None,
        variance=round(var_val, 6) if var_val is not None else None,
        skewness=round(skew_val, 6) if skew_val is not None else None,
        std_error_skewness=round(se_skew, 6) if se_skew is not None else None,
        kurtosis=round(kurt_val, 6) if kurt_val is not None else None,
        std_error_kurtosis=round(se_kurt, 6) if se_kurt is not None else None,
        range_val=round(range_val, 6) if range_val is not None else None,
        minimum=round(min_val, 6) if min_val is not None else None,
        maximum=round(max_val, 6) if max_val is not None else None,
        sum_val=round(sum_val, 6) if sum_val is not None else None,
        q1=round(q1, 6) if q1 is not None else None,
        q3=round(q3, 6) if q3 is not None else None,
        iqr=round(iqr, 6) if iqr is not None else None,
        warnings=warnings,
    )


def compute_descriptives(
    data: Dict[str, Sequence[Any]],
    variable_names: List[str],
    user_missing: Optional[Dict[str, Sequence[Any]]] = None,
    options: Optional[Dict[str, Any]] = None,
) -> DescriptivesResult:
    """
    Computes descriptives across multiple specified variables.
    """
    user_missing_map = user_missing or {}
    results: List[VariableDescriptives] = []
    total_obs = 0

    for name in variable_names:
        series = data.get(name, [])
        if len(series) > total_obs:
            total_obs = len(series)
        var_res = calculate_variable_descriptives(
            series=series,
            variable_name=name,
            user_missing_values=user_missing_map.get(name),
        )
        results.append(var_res)

    return DescriptivesResult(
        variables=results,
        total_observations=total_obs,
        options=options or {},
    )
