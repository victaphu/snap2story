export type PlaceholderInputType = 'text' | 'textarea' | 'select';

export interface TemplatePlaceholder {
  id?: string;
  story_id: string;
  key: string;
  label: string;
  description?: string | null;
  input_type: PlaceholderInputType;
  default_value?: string | null;
  options?: any;
  required?: boolean;
  sort_order?: number;
}

