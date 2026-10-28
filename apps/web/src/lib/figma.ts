import "server-only";
import type { FigmaStyleNode, FigmaVariablesMeta } from "@brandrail/engine";

const API = "https://api.figma.com/v1";

export type FigmaFetchResult =
  | { ok: true; fileName: string; kind: "variables"; data: { meta: FigmaVariablesMeta }; notes: string[] }
  | { ok: true; fileName: string; kind: "styles"; data: { styles: FigmaStyleNode[] }; notes: string[] }
  | { ok: false; error: string };

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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "X-Figma-Token": token },
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { err?: string; message?: string };
      msg = body.message ?? body.err ?? msg;
    } catch {}
    throw new FigmaError(res.status, msg);
  }
  return (await res.json()) as T;
}

type FileResponse = { name: string; styles?: Record<string, { name: string; styleType: FigmaStyleNode["styleType"]; description?: string; remote?: boolean }> };
type StylesResponse = { meta?: { styles?: Array<{ node_id: string; name: string; style_type: FigmaStyleNode["styleType"]; description?: string }> } };
type NodesResponse = { nodes: Record<string, { document?: { fills?: unknown[]; style?: Record<string, unknown> } } | null> };

function friendly(e: unknown): string {
  if (e instanceof FigmaError) {
    if (e.status === 403) return "Figma rejected the token. Create a personal access token (Figma → Settings → Security) with “File content: read” access, and check that its account can open the file.";
    if (e.status === 404) return "Figma couldn't find that file. Check the link, and that the token's account can open it.";
    if (e.status === 429) return "Figma is rate limiting requests. Wait a minute and try again.";
    return `Figma returned ${e.status}: ${e.message}`;
  }
  if (e instanceof Error && e.name === "TimeoutError") return "Figma took too long to respond. Try again.";
  return "Couldn't reach Figma.";
}

export async function fetchFigmaTokens(token: string, url: string): Promise<FigmaFetchResult> {
  const t = token.trim();
  if (t.length < 20 || t.length > 200 || /\s/.test(t)) return { ok: false, error: "Paste a Figma personal access token (it usually starts with figd_)." };
  const key = parseFigmaKey(url);
  if (!key) return { ok: false, error: "Paste a Figma file link, like https://www.figma.com/design/AbC123…/My-Design-System" };

  let file: FileResponse;
  try {
    file = await get<FileResponse>(`/files/${key}?depth=1`, t);
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }

  // 1. Variables (Enterprise plans, token needs the file_variables:read scope).
  try {
    const res = await get<{ meta: FigmaVariablesMeta }>(`/files/${key}/variables/local`, t);
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
      return { ok: true, fileName: file.name, kind: "variables", data: { meta }, notes: [] };
    }
  } catch (e) {
    if (!(e instanceof FigmaError) || (e.status !== 403 && e.status !== 404 && e.status !== 400)) return { ok: false, error: friendly(e) };
  }

  // 2. Fallback: colour and text styles (any plan).
  try {
    const ids = new Map<string, { name: string; styleType: FigmaStyleNode["styleType"]; description?: string }>();
    for (const [id, s] of Object.entries(file.styles ?? {})) if (!s.remote) ids.set(id, s);
    try {
      const published = await get<StylesResponse>(`/files/${key}/styles`, t);
      for (const s of published.meta?.styles ?? []) ids.set(s.node_id, { name: s.name, styleType: s.style_type, description: s.description });
    } catch {
      /* not a library: local styles from the file are enough */
    }
    const wanted = [...ids.entries()].filter(([, s]) => s.styleType === "FILL" || s.styleType === "TEXT");
    if (!wanted.length) {
      return {
        ok: false,
        error: `“${file.name}” has no variables we can read and no colour or text styles. Reading variables over the API needs a Figma Enterprise plan; otherwise export them as JSON (e.g. with the Tokens Studio or Variables to JSON plugin) and upload the file instead.`,
      };
    }
    const styles: FigmaStyleNode[] = [];
    for (let i = 0; i < wanted.length; i += 150) {
      const chunk = wanted.slice(i, i + 150);
      const nodes = await get<NodesResponse>(`/files/${key}/nodes?ids=${encodeURIComponent(chunk.map(([id]) => id).join(","))}`, t);
      for (const [id, s] of chunk) {
        const doc = nodes.nodes[id]?.document;
        styles.push({ name: s.name, styleType: s.styleType, description: s.description || undefined, node: { fills: doc?.fills as never, style: doc?.style as never } });
      }
    }
    return {
      ok: true,
      fileName: file.name,
      kind: "styles",
      data: { styles },
      notes: ["Figma's Variables API needs an Enterprise plan, so colour and text styles were imported instead. To bring variables (with modes), export them as JSON from Figma and upload the file."],
    };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}
