"""
Standalone Linear Regression Engine.

Pure Python module leveraging statsmodels (statsmodels.api.OLS) and NumPy.
Follows SPSS Linear Regression Model Summary, ANOVA, and Coefficients tables.
CRITICAL: Zero imports of FastAPI, SQLAlchemy, or HTTP libraries.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence
import math
import numpy as np
import statsmodels.api as sm


@dataclass
class RegressionCoefficientRow:
    variable_name: str
    unstandardized_b: float
    std_error: float
    standardized_beta: Optional[float]
    t_stat: float
    p_value: float
    ci_lower: float
    ci_upper: float
    tolerance: Optional[float] = None
    vif: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variable_name": self.variable_name,
            "unstandardized_b": round(self.unstandardized_b, 4),
            "std_error": round(self.std_error, 4),
            "standardized_beta": round(self.standardized_beta, 4) if self.standardized_beta is not None else None,
            "t_stat": round(self.t_stat, 4),
            "p_value": round(self.p_value, 5),
            "ci_lower": round(self.ci_lower, 4),
            "ci_upper": round(self.ci_upper, 4),
            "tolerance": round(self.tolerance, 4) if self.tolerance is not None else None,
            "vif": round(self.vif, 4) if self.vif is not None else None,
        }


@dataclass
class RegressionAnovaRow:
    source: str  # "Regression", "Residual", "Total"
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
class LinearRegressionResult:
    dependent_var_name: str
    independent_var_names: List[str]
    n_valid: int
    n_missing: int
    r: float
    r_squared: float
    adj_r_squared: float
    std_error_estimate: float
    anova_table: List[RegressionAnovaRow]
    coefficients: List[RegressionCoefficientRow]
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dependent_var_name": self.dependent_var_name,
            "independent_var_names": self.independent_var_names,
            "n_valid": self.n_valid,
            "n_missing": self.n_missing,
            "r": round(self.r, 4),
            "r_squared": round(self.r_squared, 4),
            "adj_r_squared": round(self.adj_r_squared, 4),
            "std_error_estimate": round(self.std_error_estimate, 4),
            "anova_table": [a.to_dict() for a in self.anova_table],
            "coefficients": [c.to_dict() for c in self.coefficients],
            "warnings": self.warnings,
        }


def calculate_linear_regression(
    data: Dict[str, Sequence[Any]],
    dependent_var: str,
    independent_vars: List[str],
    user_missing: Optional[Dict[str, Sequence[Any]]] = None,
    confidence_level: float = 0.95,
) -> LinearRegressionResult:
    warnings: List[str] = []
    missing_map = user_missing or {}

    dep_series = data.get(dependent_var, [])
    dep_miss = set(missing_map.get(dependent_var, []))

    all_vars = [dependent_var] + independent_vars
    n_cases = min(len(data.get(v, [])) for v in all_vars)

    valid_rows: List[List[float]] = []
    missing_count = 0

    for i in range(n_cases):
        row_vals: List[float] = []
        is_missing = False

        for v in all_vars:
            val = data.get(v, [])[i]
            v_miss = set(missing_map.get(v, []))
            if val is None or val in v_miss:
                is_missing = True
                break
            try:
                num = float(val)
                if math.isnan(num) or math.isinf(num):
                    is_missing = True
                    break
                row_vals.append(num)
            except (ValueError, TypeError):
                is_missing = True
                break

        if is_missing:
            missing_count += 1
        else:
            valid_rows.append(row_vals)

    n_valid = len(valid_rows)
    p = len(independent_vars)

    if n_valid <= p + 1:
        return LinearRegressionResult(
            dependent_var_name=dependent_var,
            independent_var_names=independent_vars,
            n_valid=n_valid,
            n_missing=missing_count,
            r=0.0,
            r_squared=0.0,
            adj_r_squared=0.0,
            std_error_estimate=0.0,
            anova_table=[],
            coefficients=[],
            warnings=[f"Insufficient valid cases (N={n_valid}). Need at least {p + 2} valid observations."],
        )

    mat = np.array(valid_rows, dtype=np.float64)
    y = mat[:, 0]
    X_raw = mat[:, 1:]

    # Add constant
    X = sm.add_constant(X_raw)

    # Fit OLS model via statsmodels
    model = sm.OLS(y, X)
    results = model.fit()

    r_squared = float(results.rsquared)
    r = math.sqrt(max(0.0, r_squared))
    adj_r_squared = float(results.rsquared_adj)
    std_err_est = math.sqrt(float(results.mse_resid))

    # ANOVA table
    ss_reg = float(results.ess)
    df_reg = int(results.df_model)
    ms_reg = ss_reg / df_reg if df_reg > 0 else 0.0

    ss_resid = float(results.ssr)
    df_resid = int(results.df_resid)
    ms_resid = ss_resid / df_resid if df_resid > 0 else 0.0

    ss_total = ss_reg + ss_resid
    df_total = df_reg + df_resid

    f_stat = float(results.fvalue) if hasattr(results, "fvalue") and results.fvalue is not None else None
    f_pvalue = float(results.f_pvalue) if hasattr(results, "f_pvalue") and results.f_pvalue is not None else None

    anova_table = [
        RegressionAnovaRow(
            source="Regression",
            sum_of_squares=ss_reg,
            df=df_reg,
            mean_square=ms_reg,
            f_statistic=f_stat,
            p_value=f_pvalue,
        ),
        RegressionAnovaRow(
            source="Residual",
            sum_of_squares=ss_resid,
            df=df_resid,
            mean_square=ms_resid,
            f_statistic=None,
            p_value=None,
        ),
        RegressionAnovaRow(
            source="Total",
            sum_of_squares=ss_total,
            df=df_total,
            mean_square=None,
            f_statistic=None,
            p_value=None,
        ),
    ]

    # Standardized Betas: beta_j = B_j * (sd_Xj / sd_Y)
    y_sd = float(np.std(y, ddof=1))

    # Collinearity VIF calculation if p >= 2
    vif_dict: Dict[int, float] = {}
    if p >= 2:
        for idx in range(p):
            x_target = X_raw[:, idx]
            x_others = np.delete(X_raw, idx, axis=1)
            x_others_const = sm.add_constant(x_others)
            sub_res = sm.OLS(x_target, x_others_const).fit()
            sub_r2 = float(sub_res.rsquared)
            tol = 1.0 - sub_r2
            vif_val = 1.0 / tol if tol > 1e-7 else 999.0
            vif_dict[idx] = vif_val

    # Coefficients
    coef_rows: List[RegressionCoefficientRow] = []
    ci = results.conf_int(alpha=1.0 - confidence_level)

    # (Constant)
    coef_rows.append(
        RegressionCoefficientRow(
            variable_name="(Constant)",
            unstandardized_b=float(results.params[0]),
            std_error=float(results.bse[0]),
            standardized_beta=None,
            t_stat=float(results.tvalues[0]),
            p_value=float(results.pvalues[0]),
            ci_lower=float(ci[0][0]),
            ci_upper=float(ci[0][1]),
            tolerance=None,
            vif=None,
        )
    )

    for idx, var_name in enumerate(independent_vars):
        b = float(results.params[idx + 1])
        b_se = float(results.bse[idx + 1])
        t_val = float(results.tvalues[idx + 1])
        p_val = float(results.pvalues[idx + 1])
        ci_low = float(ci[idx + 1][0])
        ci_high = float(ci[idx + 1][1])

        xj_sd = float(np.std(X_raw[:, idx], ddof=1))
        beta = b * (xj_sd / y_sd) if y_sd > 0 else 0.0

        vif_val = vif_dict.get(idx)
        tolerance = (1.0 / vif_val) if vif_val else None

        coef_rows.append(
            RegressionCoefficientRow(
                variable_name=var_name,
                unstandardized_b=b,
                std_error=b_se,
                standardized_beta=beta,
                t_stat=t_val,
                p_value=p_val,
                ci_lower=ci_low,
                ci_upper=ci_high,
                tolerance=tolerance,
                vif=vif_val,
            )
        )

    return LinearRegressionResult(
        dependent_var_name=dependent_var,
        independent_var_names=independent_vars,
        n_valid=n_valid,
        n_missing=missing_count,
        r=r,
        r_squared=r_squared,
        adj_r_squared=adj_r_squared,
        std_error_estimate=std_err_est,
        anova_table=anova_table,
        coefficients=coef_rows,
        warnings=warnings,
    )
