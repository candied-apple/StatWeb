export type MeasurementLevel = 'nominal' | 'ordinal' | 'scale';
export type VariableDataType = 'numeric' | 'string' | 'date' | 'boolean';
export type VariableRole = 'input' | 'target' | 'both' | 'none';

export interface Variable {
  id: string;
  dataset_id: string;
  name: string;
  column_index: number;
  label: string | null;
  data_type: VariableDataType;
  measurement_level: MeasurementLevel;
  role: VariableRole;
  missing_values: (number | string)[] | null;
  value_labels: Record<string, string> | null;
  display_width: number;
  decimals: number;
}

export interface VariableUpdate {
  name?: string;
  label?: string | null;
  data_type?: VariableDataType;
  measurement_level?: MeasurementLevel;
  role?: VariableRole;
  missing_values?: (number | string)[] | null;
  value_labels?: Record<string, string> | null;
  display_width?: number;
  decimals?: number;
}
