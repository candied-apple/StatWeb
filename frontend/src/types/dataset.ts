import { Variable } from './variable';

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  original_filename: string;
  file_format: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  variables?: Variable[];
}

export interface DatasetDataPage {
  dataset_id: string;
  total_rows: number;
  offset: number;
  limit: number;
  columns: string[];
  rows: Record<string, any>[];
}

export interface CellUpdateItem {
  row_index: number;
  column_name: string;
  value: any;
}

export interface AddVariablePayload {
  name: string;
  data_type?: 'numeric' | 'string' | 'date' | 'boolean';
  label?: string;
  measurement_level?: 'scale' | 'nominal' | 'ordinal';
  decimals?: number;
}

export interface ComputeVariablePayload {
  target_variable: string;
  expression: string;
  label?: string;
}

export interface RecodeRule {
  old_value?: any;
  new_value: any;
  is_range?: boolean;
  range_min?: number;
  range_max?: number;
  is_else?: boolean;
}

export interface RecodeVariablePayload {
  source_variable: string;
  target_variable: string;
  rules: RecodeRule[];
  label?: string;
}
