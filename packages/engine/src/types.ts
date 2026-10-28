export type Severity = "error" | "warning" | "info";
export type RuleSetting = Severity | "off";

/** W3C Design Tokens (DTCG) document: nested groups with { $type, $value } leaves. */
export type DtcgToken = { $type?: string; $value: unknown; $description?: string };
export type DtcgDoc = { [key: string]: DtcgToken | DtcgDoc | unknown };

export interface ComponentEntry {
  /** Component name as imported, e.g. "Button". */
  name: string;
  /** Package or path it is imported from, e.g. "@acme/ui". */
  importPath: string;
  /** Raw HTML elements this component replaces, e.g. ["button"]. Inferred from the name when omitted. */
  replaces?: string[];
}

/** brandrail.config.json */
export interface BrandrailConfig {
  $schema?: string;
  org?: string;
  tokenVersion?: string;
  tokens: DtcgDoc;
  components?: ComponentEntry[];
  rules?: Partial<Record<string, RuleSetting>>;
  /** Globs (relative to the scan root) to skip, added to the defaults. */
  ignore?: string[];
  /** Packages that must not be imported, e.g. other UI libraries. */
  forbiddenImports?: string[];
  /** ΔE distance under which a colour counts as "the same" as a token. Default 2.5. */
  colorTolerance?: number;
}

export interface SourceFile {
  path: string;
  content: string;
}

export interface Violation {
  ruleId: string;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion?: string;
  snippet?: string;
}

export interface Report {
  engineVersion: string;
  tokenVersion?: string;
  score: number;
  counts: Record<Severity, number>;
  filesScanned: number;
  linesScanned: number;
  violations: Violation[];
  byRule: Array<{ ruleId: string; count: number }>;
  durationMs: number;
}
