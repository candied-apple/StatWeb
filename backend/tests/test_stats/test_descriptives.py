import pytest
import math
from app.stats.descriptives import (
    calculate_variable_descriptives,
    compute_descriptives,
)


def test_descriptives_reference_values():
    """
    Validates descriptive statistics against exact analytical reference values
    matching R and SPSS standard computations (N=10 sample).
    """
    # Reference sample: 10, 12, 14, 15, 17, 18, 18, 20, 22, 24
    data = [10, 12, 14, 15, 17, 18, 18, 20, 22, 24]

    result = calculate_variable_descriptives(data, "test_var")

    assert result.n_valid == 10
    assert result.n_missing == 0
    assert result.mean == pytest.approx(17.0, rel=1e-5)
    assert result.sum_val == pytest.approx(170.0, rel=1e-5)
    assert result.minimum == pytest.approx(10.0, rel=1e-5)
    assert result.maximum == pytest.approx(24.0, rel=1e-5)
    assert result.range_val == pytest.approx(14.0, rel=1e-5)
    assert result.median == pytest.approx(17.5, rel=1e-5)
    assert result.mode == pytest.approx(18.0, rel=1e-5)

    # Sample variance (ddof=1) = 172 / 9 = 19.111111
    assert result.variance == pytest.approx(19.111111, rel=1e-4)
    # Sample standard deviation = sqrt(172/9) = 4.371626
    assert result.std_dev == pytest.approx(4.371626, rel=1e-4)
    # Standard error of mean = 4.371626 / sqrt(10) = 1.382431
    assert result.std_error_mean == pytest.approx(1.382431, rel=1e-4)

    # Unbiased Skewness & Kurtosis
    assert result.skewness is not None
    assert result.kurtosis is not None
    assert result.std_error_skewness is not None
    assert result.std_error_kurtosis is not None

    # Quantiles
    assert result.q1 == pytest.approx(14.25, rel=1e-4)
    assert result.q3 == pytest.approx(19.5, rel=1e-4)
    assert result.iqr == pytest.approx(5.25, rel=1e-4)
    assert len(result.warnings) == 0


def test_missing_values_and_user_missing():
    """
    Ensures missing values (None, NaN, user codes) are excluded from computation
    and accurately counted without silent coercion.
    """
    raw = [10.0, 20.0, None, float("nan"), 999.0, 30.0, "invalid_str"]
    result = calculate_variable_descriptives(raw, "var_with_missing", user_missing_values=[999.0])

    assert result.n_valid == 3  # 10.0, 20.0, 30.0
    assert result.n_missing == 4
    assert result.mean == pytest.approx(20.0, rel=1e-5)
    assert result.minimum == pytest.approx(10.0, rel=1e-5)
    assert result.maximum == pytest.approx(30.0, rel=1e-5)
    assert result.variance == pytest.approx(100.0, rel=1e-5)
    assert result.std_dev == pytest.approx(10.0, rel=1e-5)


def test_constant_variable_warning():
    """
    Ensures zero variance / constant variables trigger clear warnings rather than crashes.
    """
    constant_data = [5, 5, 5, 5, 5]
    result = calculate_variable_descriptives(constant_data, "constant_var")

    assert result.n_valid == 5
    assert result.variance == 0.0
    assert result.std_dev == 0.0
    assert any("constant" in w.lower() for w in result.warnings)


def test_empty_variable():
    """
    Ensures empty or all-missing variable returns clean valid=0 and warning.
    """
    empty_data = [None, None]
    result = calculate_variable_descriptives(empty_data, "empty_var")

    assert result.n_valid == 0
    assert result.n_missing == 2
    assert result.mean is None
    assert len(result.warnings) > 0


def test_compute_descriptives_multi():
    """
    Validates batch calculation across multiple variables.
    """
    dataset = {
        "x": [1, 2, 3, 4, 5],
        "y": [10, 20, 30, 40, 50],
    }
    res = compute_descriptives(dataset, ["x", "y"])
    assert len(res.variables) == 2
    assert res.total_observations == 5
    assert res.variables[0].mean == 3.0
    assert res.variables[1].mean == 30.0
