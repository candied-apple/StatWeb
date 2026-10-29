"""
StatWeb standalone statistical engine.
Pure Python module. Contains zero FastAPI, SQLAlchemy, or HTTP imports.
"""

from app.stats.descriptives import (
    VariableDescriptives,
    DescriptivesResult,
    calculate_variable_descriptives,
    compute_descriptives,
)
from app.stats.frequencies import (
    FrequencyCategory,
    VariableFrequencies,
    FrequenciesResult,
    calculate_variable_frequencies,
    compute_frequencies,
)
from app.stats.crosstabs import (
    CrosstabCell,
    ChiSquareStatistic,
    EffectSizeMeasure,
    CrosstabResult,
    calculate_crosstab,
)
from app.stats.hypothesis import (
    IndependentSamplesTTestResult,
    PairedSamplesTTestResult,
    calculate_independent_ttest,
    calculate_paired_ttest,
)
from app.stats.anova import (
    OneWayAnovaResult,
    calculate_one_way_anova,
)
from app.stats.correlation import (
    CorrelationMatrixResult,
    calculate_correlation_matrix,
)
from app.stats.regression import (
    LinearRegressionResult,
    calculate_linear_regression,
)

__all__ = [
    "VariableDescriptives",
    "DescriptivesResult",
    "calculate_variable_descriptives",
    "compute_descriptives",
    "FrequencyCategory",
    "VariableFrequencies",
    "FrequenciesResult",
    "calculate_variable_frequencies",
    "compute_frequencies",
    "CrosstabCell",
    "ChiSquareStatistic",
    "EffectSizeMeasure",
    "CrosstabResult",
    "calculate_crosstab",
    "IndependentSamplesTTestResult",
    "PairedSamplesTTestResult",
    "calculate_independent_ttest",
    "calculate_paired_ttest",
    "OneWayAnovaResult",
    "calculate_one_way_anova",
    "CorrelationMatrixResult",
    "calculate_correlation_matrix",
    "LinearRegressionResult",
    "calculate_linear_regression",
]
