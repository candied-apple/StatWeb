import { Dataset } from './dataset';

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  datasets?: Dataset[];
}
