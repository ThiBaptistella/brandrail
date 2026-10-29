import "server-only";
import type { FigmaStyleNode, FigmaVariablesMeta } from "@brandrail/engine";

const API = "https://api.figma.com/v1";

/** One line per Figma API call (endpoint, status, what it returned), shown in the import dialog. */
export type FigmaCallLog = string[];

export type FigmaFetchResult =
  | { ok: true; fileName: string; kind: "variables"; data: { meta: FigmaVariablesMeta }; notes: string[]; log: FigmaCallLog }
  | { ok: true; fileName: string; kind: "styles"; data: { styles: FigmaStyleNode[] }; notes: string[]; log: FigmaCallLog }
  | { ok: false; error: string; log: FigmaCallLog };

/** figma.com/design/KEY/Name, /file/KEY, /design/KEY/branch/BRANCH/… or a bare key. */
export function parseFigmaKey(input: string): string | null {
  const s = input.trim();
  if (/^[A-Za-z0-9]{10,64}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (!/(^|\.)figma\.com$/.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => ["file", "design", "board", "proto", "slides"].includes(p));
    if (i < 0 || !parts[i + 1]) return null;
    const b = parts.indexOf("branch");
    return b > i && parts[b + 1] ? parts[b + 1]! : parts[i + 1]!;
  } catch {
    return null;
  }
}

class FigmaError extends Error {
  status: number;
  retryAfter?: number;
  limitType?: string;
  constructor(status: number, message: string, retryAfter?: number, limitType?: string) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
    this.limitType = limitType;
  }
}

/**
 * Figma meters API reads per seat. "Tier 1" calls (reading a file or its nodes) are the scarce ones:
 * View/Collab seats get only a handful a month. So: cheap calls first, and at most two Tier 1 calls.
 */
const TIER: Record<string, string> = { meta: "tier 3", variables: "tier 2", styles: "tier 3", file: "tier 1", nodes: "tier 1" };

function makeGet(token: string, log: FigmaCallLog) {
  return async function get<T>(label: keyof typeof TIER, path: string, summarize: (body: T) => string = () => "ok"): Promise<T> {
    const t0 = Date.now();
    let res: Response;
    try {
      res = await fetch(`${API}${path}`, { headers: { "X-Figma-Token": token }, cache: "no-store", signal: AbortSignal.timeout(25_000) });
    } catch (e) {
      log.push(`${label} (${TIER[label]}): no response — ${(e as Error).name}`);
      throw e;
    }
    const ms = Date.now() - t0;
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const body = (await res.json()) as { err?: string; message?: string };
        msg = body.message ?? body.err ?? msg;
      } catch {}
      const retry = Number(res.headers.get("retry-after")) || undefined;
      const limitType = res.headers.get("x-figma-rate-limit-type") ?? undefined;
      log.push(`${label} (${TIER[label]}): ${res.status} ${msg}${retry ? ` · retry after ${retry}s` : ""}${limitType ? ` · limit ${limitType}` : ""} · ${ms}ms`);
      throw new FigmaError(res.status, msg, retry, limitType);
    }
    const body = (await res.json()) as T;
    const plan = res.headers.get("x-figma-plan-tier");
    log.push(`${label} (${TIER[label]}): ${res.status} · ${summarize(body)}${plan ? ` · plan ${plan}` : ""} · ${ms}ms`);
    return body;
  };
}

type StyleMeta = { name: string; styleType: FigmaStyleNode["styleType"]; description?: string; remote?: boolean };
type MetaResponse = { file?: { name?: string } ; name?: string };
type FileResponse = { name: string; styles?: Record<string, StyleMeta> };
type StylesResponse = { meta?: { styles?: Array<{ node_id: string; name: string; style_type: FigmaStyleNode["styleType"]; description?: string }> } };
type NodesResponse = { nodes: Record<string, { document?: { fills?: unknown[]; style?: Record<string, unknown> } } | null> };

const JSON_HINT = "Or skip the API: in Figma open Variables, right-click your collection → Export modes, and drop the ZIP on the JSON file tab. It works on every plan, with no limits.";

function waitText(seconds: number): string {
  if (seconds < 120) return `${seconds} seconds`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} hours`;
  return `${Math.round(seconds / 86400)} days`;
}

function friendly(e: unknown): string {
  if (e instanceof FigmaError) {
    if (e.status === 403) return "Figma rejected the token. Create a personal access token (Figma → Settings → Security) with “File content: read” access, and check that its account can open the file.";
    if (e.status === 404) return "Figma couldn't find that file. Check the link, and that the token's account can open it.";
    if (e.status === 429) {
      const when = e.retryAfter ? ` Figma allows the next read in about ${waitText(e.retryAfter)}.` : "";
      const seat = e.limitType === "low" ? " Your seat is on Figma's low API tier (View or Collab seats get only a few file reads a month); a Dev or Full seat gets far more." : "";
      return `Figma's API rate limit was hit.${when}${seat} ${JSON_HINT}`;
    }
    return `Figma returned ${e.status}: ${e.message}`;
  }
  if (e instanceof Error && e.name === "TimeoutError") return "Figma took too long to respond. Try again.";
  return "Couldn't reach Figma.";
}

export async function fetchFigmaTokens(token: string, url: string): Promise<FigmaFetchResult> {
  const log: FigmaCallLog = [];
  const t = token.trim();
  if (t.length < 20 || t.length > 200 || /\s/.test(t)) return { ok: false, error: "Paste a Figma personal access token (it usually starts with figd_).", log };
  const key = parseFigmaKey(url);
  if (!key) return { ok: false, error: "Paste a Figma file link, like https://www.figma.com/design/AbC123…/My-Design-System", log };
  const get = makeGet(t, log);

  // 0. File name and access check (tier 3: doesn't use the scarce file-read allowance).
  let fileName: string;
  try {
    const meta = await get<MetaResponse>("meta", `/files/${key}/meta`, (b) => `“${b.file?.name ?? b.name}”`);
    fileName = meta.file?.name ?? meta.name ?? "Figma file";
  } catch (e) {
    return { ok: false, error: friendly(e), log };
  }

  // 1. Variables (Enterprise plans; the token needs the file_variables:read scope).
  try {
    const res = await get<{ meta: FigmaVariablesMeta }>("variables", `/files/${key}/variables/local`, (b) => `${Object.keys(b.meta?.variables ?? {}).length} variables`);
    const vars = Object.values(res.meta?.variables ?? {});
    if (vars.length) {
      const meta: FigmaVariablesMeta = {
        variableCollections: Object.fromEntries(
          Object.entries(res.meta.variableCollections).map(([id, c]) => [
            id,
            { id: c.id, name: c.name, modes: c.modes, defaultModeId: c.defaultModeId, hiddenFromPublishing: c.hiddenFromPublishing, remote: c.remote },
          ]),
        ),
        variables: Object.fromEntries(
          vars.map((v) => [
            v.id,
            {
              id: v.id,
              name: v.name,
              resolvedType: v.resolvedType,
              valuesByMode: v.valuesByMode,
              variableCollectionId: v.variableCollectionId,
              description: v.description || undefined,
              hiddenFromPublishing: v.hiddenFromPublishing || undefined,
              remote: v.remote || undefined,
              scopes: v.scopes,
            },
          ]),
        ),
      };
      return { ok: true, fileName, kind: "variables", data: { meta }, notes: [], log };
    }
  } catch (e) {
    if (!(e instanceof FigmaError) || ![400, 403, 404].includes(e.status)) return { ok: false, error: friendly(e), log };
  }

  // 2. Colour and text styles (any plan). Published styles come from a cheap endpoint;
  //    only when there are none do we read the whole file (tier 1) for its local styles.
  try {
    const ids = new Map<string, StyleMeta>();
    try {
      const published = await get<StylesResponse>("styles", `/files/${key}/styles`, (b) => `${b.meta?.styles?.length ?? 0} published styles`);
      for (const s of published.meta?.styles ?? []) ids.set(s.node_id, { name: s.name, styleType: s.style_type, description: s.description });
    } catch (e) {
      if (e instanceof FigmaError && e.status === 429) throw e;
      /* not a published library */
    }
    if (![...ids.values()].some((s) => s.styleType === "FILL" || s.styleType === "TEXT")) {
      const file = await get<FileResponse>("file", `/files/${key}`, (b) => `${Object.keys(b.styles ?? {}).length} styles in the file`);
      for (const [id, s] of Object.entries(file.styles ?? {})) if (!s.remote) ids.set(id, s);
    }
    const wanted = [...ids.entries()].filter(([, s]) => s.styleType === "FILL" || s.styleType === "TEXT");
    if (!wanted.length) {
      return {
        ok: false,
        error: `“${fileName}” has no variables we can read and no colour or text styles. Reading variables over the API needs a Figma Enterprise plan. ${JSON_HINT}`,
        log,
      };
    }
    const styles: FigmaStyleNode[] = [];
    // As few tier 1 calls as possible: up to 400 ids per request.
    for (let i = 0; i < wanted.length; i += 400) {
      const chunk = wanted.slice(i, i + 400);
      const nodes = await get<NodesResponse>("nodes", `/files/${key}/nodes?ids=${encodeURIComponent(chunk.map(([id]) => id).join(","))}`, (b) => `${Object.values(b.nodes ?? {}).filter(Boolean).length}/${chunk.length} style values`);
      for (const [id, s] of chunk) {
        const doc = nodes.nodes[id]?.document;
        styles.push({ name: s.name, styleType: s.styleType, description: s.description || undefined, node: { fills: doc?.fills as never, style: doc?.style as never } });
      }
    }
    return {
      ok: true,
      fileName,
      kind: "styles",
      data: { styles },
      notes: ["Figma's Variables API needs an Enterprise plan, so colour and text styles were imported instead. To bring variables with their Light/Dark modes, use Export modes in Figma's Variables panel and drop the ZIP on the JSON file tab."],
      log,
    };
  } catch (e) {
    return { ok: false, error: friendly(e), log };
  }
}
