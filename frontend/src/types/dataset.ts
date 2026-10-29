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
