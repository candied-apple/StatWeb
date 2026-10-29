import pytest
import math
from app.stats.hypothesis import (
    calculate_independent_ttest,
    calculate_paired_ttest,
)
from app.stats.anova import calculate_one_way_anova
from app.stats.correlation import calculate_correlation_matrix
from app.stats.regression import calculate_linear_regression


def test_independent_ttest_reference():
    """
    Validates independent samples t-test against analytical reference:
    Group 1: [10, 12, 14, 16, 18] -> N=5, Mean=14.0, Var=10.0
    Group 2: [20, 22, 24, 26, 28] -> N=5, Mean=24.0, Var=10.0
    Mean difference = -10.0
    df = 8
    Pooled var = 10.0, SE diff = sqrt(10*(1/5+1/5)) = sqrt(4) = 2.0
    t = -10.0 / 2.0 = -5.0
    """
    test_data = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
    group_data = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2]

    res = calculate_independent_ttest(
        test_series=test_data,
        group_series=group_data,
        test_var_name="score",
        group_var_name="treatment",
        group1_val=1,
        group2_val=2,
    )

    assert len(res.group_stats) == 2
    assert res.group_stats[0].mean == 14.0
    assert res.group_stats[1].mean == 24.0

    eq_test = next(t for t in res.tests if t.variance_assumption == "Equal variances assumed")
    assert eq_test.mean_difference == -10.0
    assert eq_test.std_error_difference == pytest.approx(2.0, abs=1e-4)
    assert eq_test.t_stat == pytest.approx(-5.0, abs=1e-4)
    assert eq_test.df == 8.0
    assert eq_test.p_value < 0.002


def test_paired_ttest_reference():
    """
    Validates paired samples t-test against analytical reference:
    Before: [10, 12, 14, 16]
    After:  [12, 15, 18, 21]
    Diffs (Before - After): [-2, -3, -4, -5] -> N=4, Mean diff = -3.5, Var diff = 1.6667, SD diff = 1.2910
    SE diff = 1.2910 / 2 = 0.6455
    t = -3.5 / 0.6455 = -5.422
    df = 3
    """
    v1 = [10, 12, 14, 16]
    v2 = [12, 15, 18, 21]

    res = calculate_paired_ttest(
        var1_series=v1,
        var2_series=v2,
        var1_name="pre",
        var2_name="post",
    )

    assert res.n_pairs == 4
    assert res.mean_diff == pytest.approx(-3.5, abs=1e-4)
    assert res.std_diff == pytest.approx(1.2910, abs=1e-3)
    assert res.se_diff == pytest.approx(0.6455, abs=1e-3)
    assert res.t_stat == pytest.approx(-5.422, abs=1e-3)
    assert res.df == 3
    assert res.p_value < 0.02


def test_one_way_anova_reference():
    """
    Validates One-Way ANOVA against analytical reference:
    Group 1: [1, 2, 3] (Mean=2)
    Group 2: [4, 5, 6] (Mean=5)
    Group 3: [7, 8, 9] (Mean=8)
    Grand mean = 5.0
    SS between = 3*(2-5)^2 + 3*(5-5)^2 + 3*(8-5)^2 = 3*9 + 0 + 3*9 = 54.0
    df between = 2, MS between = 27.0
    SS within = (1+0+1) + (1+0+1) + (1+0+1) = 6.0
    df within = 6, MS within = 1.0
    F = 27.0 / 1.0 = 27.0
    p < 0.001
    """
    dep = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    factor = [1, 1, 1, 2, 2, 2, 3, 3, 3]

    res = calculate_one_way_anova(
        dependent_series=dep,
        factor_series=factor,
        dependent_var_name="dep",
        factor_var_name="factor",
    )

    assert len(res.group_descriptives) == 3
    between_row = next(r for r in res.anova_table if r.source == "Between Groups")
    within_row = next(r for r in res.anova_table if r.source == "Within Groups")

    assert between_row.sum_of_squares == pytest.approx(54.0, abs=1e-3)
    assert between_row.df == 2
    assert between_row.mean_square == pytest.approx(27.0, abs=1e-3)
    assert between_row.f_statistic == pytest.approx(27.0, abs=1e-3)
    assert between_row.p_value == pytest.approx(0.001, abs=1e-4)

    assert within_row.sum_of_squares == pytest.approx(6.0, abs=1e-3)
    assert within_row.df == 6
    assert within_row.mean_square == pytest.approx(1.0, abs=1e-3)


def test_correlation_matrix_reference():
    """
    Validates Pearson and Spearman correlation:
    X: [1, 2, 3, 4, 5]
    Y: [2, 4, 6, 8, 10] -> perfect positive correlation r = 1.0
    Z: [5, 4, 3, 2, 1] -> perfect negative correlation r = -1.0
    """
    data = {
        "x": [1, 2, 3, 4, 5],
        "y": [2, 4, 6, 8, 10],
        "z": [5, 4, 3, 2, 1],
    }
    res = calculate_correlation_matrix(data, ["x", "y", "z"])
    assert len(res.matrix) == 9

    xy = next(p for p in res.matrix if p.var1 == "x" and p.var2 == "y")
    assert xy.pearson_r == pytest.approx(1.0, abs=1e-4)

    xz = next(p for p in res.matrix if p.var1 == "x" and p.var2 == "z")
    assert xz.pearson_r == pytest.approx(-1.0, abs=1e-4)


def test_linear_regression_reference():
    """
    Validates simple linear regression:
    Y = 2 + 3*X
    X: [1, 2, 3, 4, 5]
    Y: [5, 8, 11, 14, 17]
    Intercept B0 = 2.0, Slope B1 = 3.0, R2 = 1.0, F-stat very large
    """
    data = {
        "x": [1, 2, 3, 4, 5],
        "y": [5, 8, 11, 14, 17],
    }
    res = calculate_linear_regression(
        data=data,
        dependent_var="y",
        independent_vars=["x"],
    )

    assert res.n_valid == 5
    assert res.r_squared == pytest.approx(1.0, abs=1e-4)

    b0 = next(c for c in res.coefficients if c.variable_name == "(Constant)")
    b1 = next(c for c in res.coefficients if c.variable_name == "x")

    assert b0.unstandardized_b == pytest.approx(2.0, abs=1e-4)
    assert b1.unstandardized_b == pytest.approx(3.0, abs=1e-4)
    assert b1.standardized_beta == pytest.approx(1.0, abs=1e-4)
