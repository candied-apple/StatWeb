"""
Standalone Bivariate Correlation Engine.

Pure Python module leveraging SciPy (scipy.stats.pearsonr, scipy.stats.spearmanr).
Follows SPSS correlation matrix format.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple
import math
import numpy as np
import scipy.stats as stats


@dataclass
class CorrelationPairResult:
    var1: str
    var2: str
    pearson_r: Optional[float]
    pearson_p: Optional[float]
    spearman_rho: Optional[float]
    spearman_p: Optional[float]
    n: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "var1": self.var1,
            "var2": self.var2,
            "pearson_r": round(self.pearson_r, 4) if self.pearson_r is not None else None,
            "pearson_p": round(self.pearson_p, 5) if self.pearson_p is not None else None,
            "spearman_rho": round(self.spearman_rho, 4) if self.spearman_rho is not None else None,
            "spearman_p": round(self.spearman_p, 5) if self.spearman_p is not None else None,
            "n": self.n,
        }


@dataclass
class CorrelationMatrixResult:
    variables: List[str]
    matrix: List[CorrelationPairResult]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variables": self.variables,
            "matrix": [p.to_dict() for p in self.matrix],
            "warnings": self.warnings,
        }


def calculate_correlation_matrix(
    data: Dict[str, Sequence[Any]],
    variable_names: List[str],
    user_missing: Optional[Dict[str, Sequence[Any]]] = None,
) -> CorrelationMatrixResult:
    warnings: List[str] = []
    missing_map = user_missing or {}
    results: List[CorrelationPairResult] = []

    for i, v1 in enumerate(variable_names):
        s1 = data.get(v1, [])
        m1 = set(missing_map.get(v1, []))

        for j, v2 in enumerate(variable_names):
            s2 = data.get(v2, [])
            m2 = set(missing_map.get(v2, []))

            # Pairwise valid extraction
            pairs: List[Tuple[float, float]] = []
            n_obs = min(len(s1), len(s2))

            for k in range(n_obs):
                val1 = s1[k]
                val2 = s2[k]

                if val1 is None or val1 in m1 or val2 is None or val2 in m2:
                    continue
                try:
                    num1 = float(val1)
                    num2 = float(val2)
                    if math.isnan(num1) or math.isinf(num1) or math.isnan(num2) or math.isinf(num2):
                        continue
                    pairs.append((num1, num2))
                except (ValueError, TypeError):
                    continue

            n_pairs = len(pairs)
            if v1 == v2:
                results.append(
                    CorrelationPairResult(
                        var1=v1,
                        var2=v2,
                        pearson_r=1.0,
                        pearson_p=None,
                        spearman_rho=1.0,
                        spearman_p=None,
                        n=n_pairs,
                    )
                )
                continue

            if n_pairs < 3:
                results.append(
                    CorrelationPairResult(
                        var1=v1,
                        var2=v2,
                        pearson_r=None,
                        pearson_p=None,
                        spearman_rho=None,
                        spearman_p=None,
                        n=n_pairs,
                    )
                )
                warnings.append(f"Pair ({v1}, {v2}) has insufficient valid cases (N={n_pairs}).")
                continue

            x = np.array([p[0] for p in pairs], dtype=np.float64)
            y = np.array([p[1] for p in pairs], dtype=np.float64)

            # Check zero variance
            if np.std(x) == 0.0 or np.std(y) == 0.0:
                results.append(
                    CorrelationPairResult(
                        var1=v1,
                        var2=v2,
                        pearson_r=None,
                        pearson_p=None,
                        spearman_rho=None,
                        spearman_p=None,
                        n=n_pairs,
                    )
                )
                warnings.append(f"Pair ({v1}, {v2}) contains a constant variable with zero variance.")
                continue

            # Pearson
            p_res = stats.pearsonr(x, y)
            # Spearman
            s_res = stats.spearmanr(x, y)

            results.append(
                CorrelationPairResult(
                    var1=v1,
                    var2=v2,
                    pearson_r=float(p_res.statistic),
                    pearson_p=float(p_res.pvalue),
                    spearman_rho=float(s_res.statistic),
                    spearman_p=float(s_res.pvalue),
                    n=n_pairs,
                )
            )

    return CorrelationMatrixResult(
        variables=variable_names,
        matrix=results,
        warnings=list(set(warnings)),
    )
