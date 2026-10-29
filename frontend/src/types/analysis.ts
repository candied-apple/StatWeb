export interface DescriptivesRequest {
  dataset_id: string;
  variable_names: string[];
  statistics?: string[];
  missing_strategy?: string;
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

export interface DescriptivesResult {
  variables: VariableDescriptives[];
  total_observations: number;
  options: Record<string, any>;
}

export interface AnalysisRun {
  id: string;
  dataset_id: string;
  analysis_type: string;
  name: string;
  parameters: {
    variables: string[];
    options: Record<string, any>;
  };
  results: DescriptivesResult;
  status: string;
  error_message: string | null;
  created_at: string;
}
