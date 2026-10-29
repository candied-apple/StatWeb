import pytest
from app.stats.crosstabs import calculate_crosstab


def test_crosstab_chi2_reference():
    """
    Validates cross-tabulation and Pearson Chi-Square against exact analytical reference:
    2x2 table:
    Row1: [20, 30] (Total 50)
    Row2: [40, 10] (Total 50)
    Total N = 100.
    Chi2 = 16.6667, df = 1, p < 0.0001, Phi = Cramer's V = 0.4082.
    """
    # Generate vectors matching table
    row_series = ([1] * 20) + ([1] * 30) + ([2] * 40) + ([2] * 10)
    col_series = ([1] * 20) + ([2] * 30) + ([1] * 40) + ([2] * 10)

    result = calculate_crosstab(
        row_series=row_series,
        col_series=col_series,
        row_var_name="treatment",
        col_var_name="outcome",
        row_val_labels={"1": "Control", "2": "Treated"},
        col_val_labels={"1": "Failure", "2": "Success"},
    )

    assert result.n_valid == 100
    assert result.n_missing == 0
    assert len(result.cells) == 4

    # Check cell percentages
    # Cell (1, 1): count 20, row_pct 40%, col_pct 33.33%, tot_pct 20%
    c11 = next(c for c in result.cells if c.row_val == 1 and c.col_val == 1)
    assert c11.count == 20
    assert c11.row_percent == 40.0
    assert c11.total_percent == 20.0

    # Chi-Square
    chi2_stat = next(t for t in result.chi_square_tests if t.test_name == "Pearson Chi-Square")
    assert chi2_stat.value == pytest.approx(16.6667, abs=1e-3)
    assert chi2_stat.df == 1
    assert chi2_stat.p_value < 0.0001

    # Effect Size
    v_stat = next(e for e in result.effect_sizes if e.name == "Cramer's V")
    assert v_stat.value == pytest.approx(0.4082, abs=1e-3)
