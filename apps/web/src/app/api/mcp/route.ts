import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { starterConfig, type BrandrailConfig } from "@brandrail/engine";
import { bearer } from "@/lib/api-keys";
import { isSupabaseConfigured } from "@/lib/env";
import { KIT_REGISTRY } from "@/lib/kit-registry";
import { createBrandrailMcp, type McpContext } from "@/lib/mcp/server";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";

export const dynamic = "force-dynamic";

type KitRow = { org: string; slug: string; tokenVersion: string | null; tokens: BrandrailConfig["tokens"]; components: BrandrailConfig["components"] };

function jsonRpcError(status: number, message: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message }, id: null }), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** Resolves the API key to the org's Brand Kit. Demo mode accepts any key and uses the starter kit. */
async function authenticate(req: Request): Promise<McpContext | Response> {
  const key = bearer(req);
  if (!key) {
    return jsonRpcError(401, "Missing Authorization: Bearer <Brandrail API key>. Create one in Dashboard → Connect.", {
      "www-authenticate": 'Bearer realm="brandrail"',
    });
  }

  if (!isSupabaseConfigured) {
    return {
      org: "Demo",
      published: false,
      config: { ...starterConfig, components: KIT_REGISTRY.map((c) => ({ ...c, importPath: "@brandrail/kit" })) },
    };
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc("get_brand_kit", { p_key: key });
  if (error) {
    if (error.code === "28000") return jsonRpcError(401, "Invalid or revoked Brandrail API key.", { "www-authenticate": 'Bearer realm="brandrail"' });
    if (error.code === "42501") return jsonRpcError(403, "This API key is missing the mcp:read scope.");
    return jsonRpcError(500, "Could not load the Brand Kit.");
  }
  const kit = data as KitRow;
  const published = Boolean(kit.tokenVersion);
  const config: BrandrailConfig = published
    ? { org: kit.slug, tokenVersion: kit.tokenVersion!, tokens: kit.tokens, components: kit.components }
    : { ...starterConfig, components: kit.components?.length ? kit.components : starterConfig.components };

  return {
    org: kit.org,
    config,
    published,
    record: async (report, { filename, project }) => {
      await supabase.rpc("ingest_scan", {
        p_key: key,
        p_payload: {
          source: "mcp",
          target: { kind: "repo", name: project || "AI tool sessions", location: project ? project : "mcp" },
          title: `validate_snippet · ${filename}`,
          // Snippets stay out of storage: only locations and messages are kept.
          report: { ...report, violations: report.violations.map(({ snippet: _s, ...v }) => v) },
        },
      });
    },
  };
}

export async function POST(req: Request) {
  const ctx = await authenticate(req);
  if (ctx instanceof Response) return ctx;
  const server = createBrandrailMcp(ctx);
  // Stateless: a fresh server + transport per request, plain JSON responses (no SSE needed for these tools).
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void server.close();
  }
}

const notAllowed = () =>
  new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. Use POST (stateless Streamable HTTP)." }, id: null }), {
    status: 405,
    headers: { "content-type": "application/json", allow: "POST" },
  });

export const GET = notAllowed;
export const DELETE = notAllowed;
