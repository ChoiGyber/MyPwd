export interface Credential {
  id: number;
  category_id: number | null;
  title: string;
  url: string | null;
  username: string;
  password: string;
  notes: string | null;
  favorite: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface CredentialInput {
  category_id: number | null;
  title: string;
  url: string;
  username: string;
  password: string;
  notes: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}
