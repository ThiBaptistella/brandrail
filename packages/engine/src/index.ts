export type { BrandrailConfig, ComponentEntry, DtcgDoc, PropSpec, Report, RuleSetting, Severity, SourceFile, Violation } from "./types.ts";
export { resolveConfig, DEFAULT_IGNORE, DEFAULT_FORBIDDEN_IMPORTS, type ResolvedConfig } from "./config.ts";
export { check, checkSnippet, computeScore, isScannable, ENGINE_VERSION, type CheckOptions } from "./check.ts";
export { RULES, RULE_IDS, type Rule } from "./rules.ts";
export { formatPretty, formatMarkdown, formatGithubAnnotations, COMMENT_MARKER } from "./report.ts";
export { parseColor, contrastRatio, deltaE, rgbToLab, toHex } from "./color.ts";
export { fileKind, makeIgnore } from "./source.ts";
export { starterConfig } from "./defaults.ts";
export { generateInstructions, upsertSection, RULES_START, RULES_END } from "./instructions.ts";
export { findComponents, findComponentByName, type ComponentMatch } from "./components.ts";
export type { TokenColor } from "./config.ts";
export { mcpClientConfigs, RULE_FILES, type McpClientConfig } from "./mcp-config.ts";
export {
  importTokens,
  fromFigmaVariables,
  fromFigmaStyles,
  fromModeObject,
  flattenTokens,
  buildDtcg,
  diffTokens,
  mergeTokens,
  classify,
  slug,
  fontWeight,
  EXT as TOKEN_EXTENSION,
  type FlatToken,
  type TokenType,
  type ImportResult,
  type ImportFormat,
  type ImportOptions,
  type TokenDiff,
  type FigmaVariablesMeta,
  type FigmaVariable,
  type FigmaCollection,
  type FigmaStyleNode,
} from "./tokens.ts";
export {
  checkRendered,
  collectRenderedNodes,
  isPrivateAddress,
  pagePath,
  ruleTitle,
  RENDERED_RULES,
  type RenderedNode,
  type RenderedPage,
  type RenderedCheckOptions,
} from "./rendered.ts";
export { generateTokensCss } from "./tokens-css.ts";
export { kitBridgeCss, pickColorRoles, type ColorRole } from "./kit-bridge.ts";
export { auditBrandKit, type KitIssue } from "./brand-kit-audit.ts";
