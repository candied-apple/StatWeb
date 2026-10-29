import pytest
from app.stats.frequencies import (
    calculate_variable_frequencies,
    compute_frequencies,
)


def test_frequencies_spss_reference():
    """
    Validates frequency calculation, raw percentages, valid percentages,
    and cumulative percentages against SPSS reference table.
    """
    # Sample data: 1=Male (6), 2=Female (4), 99=Refused (2), None=Missing (1) -> Total 13
    data = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 99, 99, None]
    value_labels = {"1": "Male", "2": "Female"}
    user_missing = [99]

    result = calculate_variable_frequencies(
        series=data,
        variable_name="gender",
        value_labels=value_labels,
        user_missing_values=user_missing,
    )

    assert result.total == 13
    assert result.n_valid == 10
    assert result.n_missing == 3

    # Check valid categories
    male_cat = next(c for c in result.categories if c.value == 1)
    assert male_cat.label == "Male"
    assert male_cat.frequency == 6
    assert male_cat.percent == pytest.approx(46.15, abs=0.01)  # 6/13 = 46.15%
    assert male_cat.valid_percent == pytest.approx(60.0, abs=0.01)  # 6/10 = 60.0%
    assert male_cat.cumulative_percent == pytest.approx(60.0, abs=0.01)

    female_cat = next(c for c in result.categories if c.value == 2)
    assert female_cat.label == "Female"
    assert female_cat.frequency == 4
    assert female_cat.percent == pytest.approx(30.77, abs=0.01)  # 4/13 = 30.77%
    assert female_cat.valid_percent == pytest.approx(40.0, abs=0.01)  # 4/10 = 40.0%
    assert female_cat.cumulative_percent == pytest.approx(100.0, abs=0.01)

    # Check missing categories
    user_miss_cat = next(c for c in result.categories if c.value == "99")
    assert user_miss_cat.frequency == 2
    assert user_miss_cat.is_missing is True
    assert user_miss_cat.valid_percent is None
