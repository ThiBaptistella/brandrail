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
  /** What it's for, in a sentence. Used by find_component. */
  description?: string;
  /** Other names people use for it, e.g. ["modal", "popup"] for Dialog. */
  aliases?: string[];
  /** Do / don't rules shown to AI tools, e.g. "One primary Button per view". */
  usageRules?: string[];
  /** A short usage example (JSX). */
  example?: string;
  status?: "draft" | "beta" | "stable" | "deprecated";
  /** The props it accepts. When set, AI tools are told to use only these and the Checker flags any other prop. */
  props?: PropSpec[];
  /** Also accepts the native attributes of this HTML element (e.g. "input", "div"). */
  htmlAttributes?: string;
}

export interface PropSpec {
  name: string;
  /** TypeScript type, with enum members spelled out, e.g. "Size (Size.SMALL | Size.MEDIUM | Size.LARGE)". */
  type?: string;
  required?: boolean;
  description?: string;
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
  /** Where `brandrail init` writes the Brand Kit as CSS variables. Default src/brandrail.tokens.css (or brandrail.tokens.css without src/). */
  tokensCss?: string;
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
