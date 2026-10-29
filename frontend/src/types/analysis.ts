export interface DescriptivesRequest {
  dataset_id: string;
  variable_names: string[];
  statistics?: string[];
  missing_strategy?: string;
}

export interface FrequenciesRequest {
  dataset_id: string;
  variable_names: string[];
}

export interface CrosstabRequest {
  dataset_id: string;
  row_variable: string;
  column_variable: string;
}

export interface IndependentTTestRequest {
  dataset_id: string;
  test_variable: string;
  group_variable: string;
  group1_value: any;
  group2_value: any;
}

export interface PairedTTestRequest {
  dataset_id: string;
  pair1_variable: string;
  pair2_variable: string;
}

export interface AnovaRequest {
  dataset_id: string;
  dependent_variable: string;
  factor_variable: string;
}

export interface CorrelationRequest {
  dataset_id: string;
  variable_names: string[];
}

export interface RegressionRequest {
  dataset_id: string;
  dependent_variable: string;
  independent_variables: string[];
}

export interface VariableDescriptives {
  variable_name: string;
  n_valid: number;
  n_missing: number;
  mean: number | null;
  std_error_mean: number | null;
  median: number | null;
  mode: number | null;
  std_dev: number | null;
  variance: number | null;
  skewness: number | null;
  std_error_skewness: number | null;
  kurtosis: number | null;
  std_error_kurtosis: number | null;
  range: number | null;
  minimum: number | null;
  maximum: number | null;
  sum: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  warnings: string[];
}

export interface AnalysisRun {
  id: string;
  dataset_id: string;
  analysis_type: string;
  name: string;
  parameters: Record<string, any>;
  results: Record<string, any>;
  status: string;
  error_message: string | null;
  created_at: string;
}
