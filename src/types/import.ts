import type { Credential } from "./credential";

export interface ImportedCredential {
  title: string;
  url: string;
  username: string;
  password: string;
  source: string;
}

export interface DuplicateInfo {
  imported: ImportedCredential;
  existing: Credential | null;
  status: "new" | "exact_duplicate" | "conflict";
}

export interface BrowserInfo {
  name: string;
  profile_path: string;
  browser_type: string;
}
