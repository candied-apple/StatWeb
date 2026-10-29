"""
Standalone Hypothesis Testing Engine (t-tests).

Pure Python module leveraging SciPy (scipy.stats).
Follows SPSS independent-samples and paired-samples reporting formats.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple
import math
import numpy as np
import scipy.stats as stats


@dataclass
class GroupDescriptiveStat:
    group_value: Any
    group_label: str
    n: int
    mean: float
    std_dev: float
    std_error_mean: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "group_value": self.group_value,
            "group_label": self.group_label,
            "n": self.n,
            "mean": round(self.mean, 4),
            "std_dev": round(self.std_dev, 4),
            "std_error_mean": round(self.std_error_mean, 4),
        }


@dataclass
class TTestRow:
    variance_assumption: str  # "Equal variances assumed" or "Equal variances not assumed"
    t_stat: float
    df: float
    p_value: float
    mean_difference: float
    std_error_difference: float
    ci_lower: float
    ci_upper: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variance_assumption": self.variance_assumption,
            "t_stat": round(self.t_stat, 4),
            "df": round(self.df, 3),
            "p_value": round(self.p_value, 5),
            "mean_difference": round(self.mean_difference, 4),
            "std_error_difference": round(self.std_error_difference, 4),
            "ci_lower": round(self.ci_lower, 4),
            "ci_upper": round(self.ci_upper, 4),
        }


@dataclass
class IndependentSamplesTTestResult:
    test_var_name: str
    group_var_name: str
    group_stats: List[GroupDescriptiveStat]
    levene_f: Optional[float]
    levene_p: Optional[float]
    tests: List[TTestRow]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_var_name": self.test_var_name,
            "group_var_name": self.group_var_name,
            "group_stats": [g.to_dict() for g in self.group_stats],
            "levene_f": round(self.levene_f, 4) if self.levene_f is not None else None,
            "levene_p": round(self.levene_p, 5) if self.levene_p is not None else None,
            "tests": [t.to_dict() for t in self.tests],
            "warnings": self.warnings,
        }


@dataclass
class PairedSamplesTTestResult:
    var1_name: str
    var2_name: str
    n_pairs: int
    mean1: float
    mean2: float
    std1: float
    std2: float
    mean_diff: float
    std_diff: float
    se_diff: float
    t_stat: Optional[float]
    df: int
    p_value: Optional[float]
    ci_lower: Optional[float]
    ci_upper: Optional[float]
    correlation: Optional[float]
    correlation_p: Optional[float]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "var1_name": self.var1_name,
            "var2_name": self.var2_name,
            "n_pairs": self.n_pairs,
            "mean1": round(self.mean1, 4),
            "mean2": round(self.mean2, 4),
            "std1": round(self.std1, 4),
            "std2": round(self.std2, 4),
            "mean_diff": round(self.mean_diff, 4),
            "std_diff": round(self.std_diff, 4),
            "se_diff": round(self.se_diff, 4),
            "t_stat": round(self.t_stat, 4) if self.t_stat is not None else None,
            "df": self.df,
            "p_value": round(self.p_value, 5) if self.p_value is not None else None,
            "ci_lower": round(self.ci_lower, 4) if self.ci_lower is not None else None,
            "ci_upper": round(self.ci_upper, 4) if self.ci_upper is not None else None,
            "correlation": round(self.correlation, 4) if self.correlation is not None else None,
            "correlation_p": round(self.correlation_p, 5) if self.correlation_p is not None else None,
            "warnings": self.warnings,
        }


def calculate_independent_ttest(
    test_series: Sequence[Any],
    group_series: Sequence[Any],
    test_var_name: str,
    group_var_name: str,
    group1_val: Any,
    group2_val: Any,
    group_val_labels: Optional[Dict[str, str]] = None,
    test_missing: Optional[Sequence[Any]] = None,
    group_missing: Optional[Sequence[Any]] = None,
    confidence_level: float = 0.95,
) -> IndependentSamplesTTestResult:
    warnings: List[str] = []
    labels = group_val_labels or {}
    t_miss = set(test_missing or [])
    g_miss = set(group_missing or [])

    g1_data: List[float] = []
    g2_data: List[float] = []

    n_cases = min(len(test_series), len(group_series))
    for i in range(n_cases):
        t_val = test_series[i]
        g_val = group_series[i]

        if t_val is None or t_val in t_miss or g_val is None or g_val in g_miss:
            continue
        try:
            num = float(t_val)
            if math.isnan(num) or math.isinf(num):
                continue
            if str(g_val) == str(group1_val):
                g1_data.append(num)
            elif str(g_val) == str(group2_val):
                g2_data.append(num)
        except (ValueError, TypeError):
            continue

    n1, n2 = len(g1_data), len(g2_data)
    if n1 < 2 or n2 < 2:
        return IndependentSamplesTTestResult(
            test_var_name=test_var_name,
            group_var_name=group_var_name,
            group_stats=[],
            levene_f=None,
            levene_p=None,
            tests=[],
            warnings=[f"Insufficient valid cases in groups (Group 1: {n1}, Group 2: {n2}). Need at least 2 in each."],
        )

    arr1 = np.array(g1_data, dtype=np.float64)
    arr2 = np.array(g2_data, dtype=np.float64)

    m1, m2 = float(np.mean(arr1)), float(np.mean(arr2))
    s1, s2 = float(np.std(arr1, ddof=1)), float(np.std(arr2, ddof=1))
    se1 = s1 / math.sqrt(n1) if n1 > 0 else 0.0
    se2 = s2 / math.sqrt(n2) if n2 > 0 else 0.0

    group_stats = [
        GroupDescriptiveStat(
            group_value=group1_val,
            group_label=labels.get(str(group1_val), str(group1_val)),
            n=n1,
            mean=m1,
            std_dev=s1,
            std_error_mean=se1,
        ),
        GroupDescriptiveStat(
            group_value=group2_val,
            group_label=labels.get(str(group2_val), str(group2_val)),
            n=n2,
            mean=m2,
            std_dev=s2,
            std_error_mean=se2,
        ),
    ]

    # Levene's test for equality of variances
    levene_f: Optional[float] = None
    levene_p: Optional[float] = None
    try:
        lev_res = stats.levene(arr1, arr2)
        levene_f = float(lev_res.statistic)
        levene_p = float(lev_res.pvalue)
    except Exception as e:
        warnings.append(f"Levene test notice: {str(e)}")

    diff = m1 - m2
    alpha = 1.0 - confidence_level

    # 1. Equal variances assumed (Student's t-test)
    df_pool = n1 + n2 - 2
    sp_sq = (((n1 - 1) * s1**2) + ((n2 - 1) * s2**2)) / df_pool
    se_pool = math.sqrt(sp_sq * (1.0 / n1 + 1.0 / n2))
    t_eq_res = stats.ttest_ind(arr1, arr2, equal_var=True)
    t_pool = float(t_eq_res.statistic)
    p_pool = float(t_eq_res.pvalue)
    t_crit_pool = stats.t.ppf(1.0 - alpha / 2.0, df_pool)
    ci_lower_pool = diff - t_crit_pool * se_pool
    ci_upper_pool = diff + t_crit_pool * se_pool

    row_eq = TTestRow(
        variance_assumption="Equal variances assumed",
        t_stat=t_pool,
        df=float(df_pool),
        p_value=p_pool,
        mean_difference=diff,
        std_error_difference=se_pool,
        ci_lower=ci_lower_pool,
        ci_upper=ci_upper_pool,
    )

    # 2. Equal variances not assumed (Welch's t-test)
    se_welch = math.sqrt((s1**2 / n1) + (s2**2 / n2))
    t_welch_res = stats.ttest_ind(arr1, arr2, equal_var=False)
    t_welch = float(t_welch_res.statistic)
    p_welch = float(t_welch_res.pvalue)
    # Welch-Satterthwaite df
    num_df = ((s1**2 / n1) + (s2**2 / n2)) ** 2
    den_df = ((s1**2 / n1) ** 2 / (n1 - 1)) + ((s2**2 / n2) ** 2 / (n2 - 1))
    df_welch = num_df / den_df if den_df > 0 else float(df_pool)

    t_crit_welch = stats.t.ppf(1.0 - alpha / 2.0, df_welch)
    ci_lower_welch = diff - t_crit_welch * se_welch
    ci_upper_welch = diff + t_crit_welch * se_welch

    row_welch = TTestRow(
        variance_assumption="Equal variances not assumed",
        t_stat=t_welch,
        df=df_welch,
        p_value=p_welch,
        mean_difference=diff,
        std_error_difference=se_welch,
        ci_lower=ci_lower_welch,
        ci_upper=ci_upper_welch,
    )

    return IndependentSamplesTTestResult(
        test_var_name=test_var_name,
        group_var_name=group_var_name,
        group_stats=group_stats,
        levene_f=levene_f,
        levene_p=levene_p,
        tests=[row_eq, row_welch],
        warnings=warnings,
    )


def calculate_paired_ttest(
    var1_series: Sequence[Any],
    var2_series: Sequence[Any],
    var1_name: str,
    var2_name: str,
    var1_missing: Optional[Sequence[Any]] = None,
    var2_missing: Optional[Sequence[Any]] = None,
    confidence_level: float = 0.95,
) -> PairedSamplesTTestResult:
    warnings: List[str] = []
    m1_codes = set(var1_missing or [])
    m2_codes = set(var2_missing or [])

    pairs: List[Tuple[float, float]] = []
    n_cases = min(len(var1_series), len(var2_series))

    for i in range(n_cases):
        v1 = var1_series[i]
        v2 = var2_series[i]

        if v1 is None or v1 in m1_codes or v2 is None or v2 in m2_codes:
            continue
        try:
            num1 = float(v1)
            num2 = float(v2)
            if math.isnan(num1) or math.isinf(num1) or math.isnan(num2) or math.isinf(num2):
                continue
            pairs.append((num1, num2))
        except (ValueError, TypeError):
            continue

    n = len(pairs)
    if n < 2:
        return PairedSamplesTTestResult(
            var1_name=var1_name,
            var2_name=var2_name,
            n_pairs=n,
            mean1=0.0,
            mean2=0.0,
            std1=0.0,
            std2=0.0,
            mean_diff=0.0,
            std_diff=0.0,
            se_diff=0.0,
            t_stat=0.0,
            df=0,
            p_value=1.0,
            ci_lower=0.0,
            ci_upper=0.0,
            correlation=0.0,
            correlation_p=1.0,
            warnings=["Need at least 2 valid paired cases to compute paired t-test."],
        )

    arr1 = np.array([p[0] for p in pairs], dtype=np.float64)
    arr2 = np.array([p[1] for p in pairs], dtype=np.float64)
    diffs = arr1 - arr2

    m1, m2 = float(np.mean(arr1)), float(np.mean(arr2))
    s1, s2 = float(np.std(arr1, ddof=1)), float(np.std(arr2, ddof=1))
    mean_diff = float(np.mean(diffs))
    std_diff = float(np.std(diffs, ddof=1))
    se_diff = std_diff / math.sqrt(n) if n > 0 else 0.0

    df = n - 1
    alpha = 1.0 - confidence_level

    t_stat: Optional[float] = None
    p_val: Optional[float] = None
    ci_lower: Optional[float] = None
    ci_upper: Optional[float] = None

    if std_diff == 0.0 or se_diff == 0.0:
        ci_lower = mean_diff
        ci_upper = mean_diff
        warnings.append("Paired differences are constant (variance is zero). Cannot compute t-statistic.")
    else:
        res = stats.ttest_rel(arr1, arr2)
        t_stat = float(res.statistic)
        p_val = float(res.pvalue)
        t_crit = stats.t.ppf(1.0 - alpha / 2.0, df)
        ci_lower = mean_diff - t_crit * se_diff
        ci_upper = mean_diff + t_crit * se_diff

    # Correlation
    r_val: Optional[float] = None
    r_p: Optional[float] = None
    if s1 > 0.0 and s2 > 0.0:
        r_res = stats.pearsonr(arr1, arr2)
        r_val = float(r_res.statistic)
        r_p = float(r_res.pvalue)
    else:
        warnings.append("One or both paired variables are constant. Correlation cannot be computed.")

    return PairedSamplesTTestResult(
        var1_name=var1_name,
        var2_name=var2_name,
        n_pairs=n,
        mean1=m1,
        mean2=m2,
        std1=s1,
        std2=s2,
        mean_diff=mean_diff,
        std_diff=std_diff,
        se_diff=se_diff,
        t_stat=t_stat,
        df=df,
        p_value=p_val,
        ci_lower=ci_lower,
        ci_upper=ci_upper,
        correlation=r_val,
        correlation_p=r_p,
        warnings=warnings,
    )
