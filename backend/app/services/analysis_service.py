import uuid
import math
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.dataset import Dataset
from app.models.variable import Variable
from app.models.analysis import AnalysisRun
from app.storage.base import StorageBackend
from app.services.dataset_service import DatasetService
from app.stats import (
    compute_descriptives,
    compute_frequencies,
    calculate_crosstab,
    calculate_independent_ttest,
    calculate_paired_ttest,
    calculate_one_way_anova,
    calculate_correlation_matrix,
    calculate_linear_regression,
)


def _sanitize_for_json(obj: Any) -> Any:
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(x) for x in obj]
    return obj


class AnalysisService:
    @classmethod
    def _get_dataset_and_variables(
        cls, db: Session, dataset_id: uuid.UUID, variable_names: List[str]
    ) -> tuple[Dataset, List[Variable]]:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        variables = (
            db.query(Variable)
            .filter(Variable.dataset_id == dataset_id, Variable.name.in_(variable_names))
            .all()
        )
        found_names = {v.name for v in variables}
        missing_vars = [name for name in variable_names if name not in found_names]
        if missing_vars:
            raise HTTPException(
                status_code=400,
                detail=f"Variables not found in dataset: {', '.join(missing_vars)}",
            )
        return dataset, variables

    @classmethod
    def run_descriptives(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        variable_names: List[str],
        options: Optional[Dict[str, Any]] = None,
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, variable_names)

        user_missing_map = {v.name: v.missing_values for v in variables if v.missing_values}
        data = DatasetService.get_columns_data(storage, dataset, variable_names)

        stat_result = compute_descriptives(
            data=data,
            variable_names=variable_names,
            user_missing=user_missing_map,
            options=options,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="descriptives",
            name=f"Betimsel İstatistikler ({', '.join(variable_names[:3])}{'...' if len(variable_names) > 3 else ''})",
            parameters={"variables": variable_names, "options": options or {}},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_frequencies(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        variable_names: List[str],
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, variable_names)

        user_missing_map = {v.name: v.missing_values for v in variables if v.missing_values}
        value_labels_map = {v.name: v.value_labels for v in variables if v.value_labels}
        data = DatasetService.get_columns_data(storage, dataset, variable_names)

        stat_result = compute_frequencies(
            data=data,
            variable_names=variable_names,
            value_labels=value_labels_map,
            user_missing=user_missing_map,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="frequencies",
            name=f"Frekans Dağılımı ({', '.join(variable_names[:3])}{'...' if len(variable_names) > 3 else ''})",
            parameters={"variables": variable_names},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_crosstabs(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        row_var: str,
        col_var: str,
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, [row_var, col_var])
        var_by_name = {v.name: v for v in variables}

        r_v = var_by_name[row_var]
        c_v = var_by_name[col_var]

        data = DatasetService.get_columns_data(storage, dataset, [row_var, col_var])

        stat_result = calculate_crosstab(
            row_series=data.get(row_var, []),
            col_series=data.get(col_var, []),
            row_var_name=row_var,
            col_var_name=col_var,
            row_val_labels=r_v.value_labels,
            col_val_labels=c_v.value_labels,
            row_missing_values=r_v.missing_values,
            col_missing_values=c_v.missing_values,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="crosstabs",
            name=f"Çapraz Tablo ({row_var} × {col_var})",
            parameters={"row_var": row_var, "col_var": col_var},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_independent_ttest(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        test_var: str,
        group_var: str,
        group1_val: Any,
        group2_val: Any,
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, [test_var, group_var])
        var_by_name = {v.name: v for v in variables}

        t_v = var_by_name[test_var]
        g_v = var_by_name[group_var]

        data = DatasetService.get_columns_data(storage, dataset, [test_var, group_var])

        stat_result = calculate_independent_ttest(
            test_series=data.get(test_var, []),
            group_series=data.get(group_var, []),
            test_var_name=test_var,
            group_var_name=group_var,
            group1_val=group1_val,
            group2_val=group2_val,
            group_val_labels=g_v.value_labels,
            test_missing=t_v.missing_values,
            group_missing=g_v.missing_values,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="ttest_ind",
            name=f"Bağımsız Örneklem T-Testi ({test_var} / {group_var})",
            parameters={
                "test_var": test_var,
                "group_var": group_var,
                "group1_val": group1_val,
                "group2_val": group2_val,
            },
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_paired_ttest(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        pair1_var: str,
        pair2_var: str,
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, [pair1_var, pair2_var])
        var_by_name = {v.name: v for v in variables}

        p1_v = var_by_name[pair1_var]
        p2_v = var_by_name[pair2_var]

        data = DatasetService.get_columns_data(storage, dataset, [pair1_var, pair2_var])

        stat_result = calculate_paired_ttest(
            var1_series=data.get(pair1_var, []),
            var2_series=data.get(pair2_var, []),
            var1_name=pair1_var,
            var2_name=pair2_var,
            var1_missing=p1_v.missing_values,
            var2_missing=p2_v.missing_values,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="ttest_paired",
            name=f"Eşleştirilmiş T-Testi ({pair1_var} - {pair2_var})",
            parameters={"pair1_var": pair1_var, "pair2_var": pair2_var},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_anova(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        dep_var: str,
        factor_var: str,
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, [dep_var, factor_var])
        var_by_name = {v.name: v for v in variables}

        d_v = var_by_name[dep_var]
        f_v = var_by_name[factor_var]

        data = DatasetService.get_columns_data(storage, dataset, [dep_var, factor_var])

        stat_result = calculate_one_way_anova(
            dependent_series=data.get(dep_var, []),
            factor_series=data.get(factor_var, []),
            dependent_var_name=dep_var,
            factor_var_name=factor_var,
            factor_val_labels=f_v.value_labels,
            dep_missing=d_v.missing_values,
            factor_missing=f_v.missing_values,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="anova",
            name=f"Tek Yönlü ANOVA ({dep_var} / {factor_var})",
            parameters={"dep_var": dep_var, "factor_var": factor_var},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_correlation(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        variable_names: List[str],
    ) -> AnalysisRun:
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, variable_names)

        user_missing_map = {v.name: v.missing_values for v in variables if v.missing_values}
        data = DatasetService.get_columns_data(storage, dataset, variable_names)

        stat_result = calculate_correlation_matrix(
            data=data,
            variable_names=variable_names,
            user_missing=user_missing_map,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="correlation",
            name=f"Korelasyon Analizi ({', '.join(variable_names[:3])}{'...' if len(variable_names) > 3 else ''})",
            parameters={"variables": variable_names},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run

    @classmethod
    def run_regression(
        cls,
        db: Session,
        storage: StorageBackend,
        dataset_id: uuid.UUID,
        dependent_var: str,
        independent_vars: List[str],
    ) -> AnalysisRun:
        all_vars = [dependent_var] + independent_vars
        dataset, variables = cls._get_dataset_and_variables(db, dataset_id, all_vars)

        user_missing_map = {v.name: v.missing_values for v in variables if v.missing_values}
        data = DatasetService.get_columns_data(storage, dataset, all_vars)

        stat_result = calculate_linear_regression(
            data=data,
            dependent_var=dependent_var,
            independent_vars=independent_vars,
            user_missing=user_missing_map,
        )

        analysis_run = AnalysisRun(
            dataset_id=dataset_id,
            analysis_type="regression",
            name=f"Doğrusal Regresyon ({dependent_var} ~ {', '.join(independent_vars)})",
            parameters={"dependent_var": dependent_var, "independent_vars": independent_vars},
            results=_sanitize_for_json(stat_result.to_dict()),
            status="completed",
        )
        db.add(analysis_run)
        db.commit()
        db.refresh(analysis_run)
        return analysis_run
