export type { BrandrailConfig, ComponentEntry, DtcgDoc, Report, RuleSetting, Severity, SourceFile, Violation } from "./types.ts";
export { resolveConfig, DEFAULT_IGNORE, DEFAULT_FORBIDDEN_IMPORTS, type ResolvedConfig } from "./config.ts";
export { check, checkSnippet, computeScore, isScannable, ENGINE_VERSION, type CheckOptions } from "./check.ts";
export { RULES, RULE_IDS, type Rule } from "./rules.ts";
export { formatPretty, formatMarkdown, formatGithubAnnotations, COMMENT_MARKER } from "./report.ts";
export { parseColor, contrastRatio, deltaE, rgbToLab, toHex } from "./color.ts";
export { fileKind, makeIgnore } from "./source.ts";
export { starterConfig } from "./defaults.ts";
export { generateInstructions, upsertSection, RULES_START, RULES_END } from "./instructions.ts";
