export type WarningKind = 'missing-script' | 'missing-file' | 'broken-link';

export interface DocLocation {
  file: string;
  line?: number;
  column?: number;
}

export interface WarningItem {
  kind: WarningKind;
  message: string;
  location: DocLocation;
  evidence: string;
}

export interface ScanOptions {
  rootDir: string;
  docsGlobs: string[];
}

export interface PackageScripts {
  scripts: Record<string, string>;
}
