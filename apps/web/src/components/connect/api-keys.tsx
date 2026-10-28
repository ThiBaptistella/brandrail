"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Plus } from "lucide-react";
import { Box, BoxHeader, Button, Flash, TextInput } from "@brandrail/ui";
import { createApiKeyAction, revokeApiKeyAction, type CreateKeyResult } from "@/app/actions/api-keys";

type Row = { id: string; name: string; prefix: string; scopes: string[]; lastUsed: string; created: string };

export function ApiKeys({ rows }: { rows: Row[] }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [result, setResult] = useState<CreateKeyResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Box>
      <BoxHeader className="justify-between">
        <span className="flex items-center gap-2">
          <KeyRound size={15} className="text-fg-subtle" />
          <h2 className="text-[13px] font-medium text-fg">API keys</h2>
        </span>
        {!creating && (
          <Button size="sm" leadingIcon={<Plus size={13} />} onClick={() => { setCreating(true); setResult(null); }}>
            New key
          </Button>
        )}
      </BoxHeader>

      {creating && (
        <form
          className="flex flex-col gap-2 border-b border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await createApiKeyAction(name);
              setResult(r);
              if (r.ok) {
                setCreating(false);
                setName("");
              }
            });
          }}
        >
          <label htmlFor="key-name" className="text-xs text-fg-muted">Name</label>
          <TextInput id="key-name" autoFocus placeholder="e.g. GitHub Actions" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="invisible" onClick={() => setCreating(false)}>Cancel</Button>
            <Button size="sm" variant="primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create key"}</Button>
          </div>
        </form>
      )}

      {result?.ok && (
        <div className="border-b border-line p-4">
          <Flash tone="success" className="flex flex-col gap-2">
            <span>
              <strong>{result.name}</strong> created. Copy it now — it won&apos;t be shown again.
            </span>
            <span className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-canvas-inset px-2 py-1 font-mono text-xs text-fg">{result.key}</code>
              <Button
                size="sm"
                aria-label="Copy key"
                onClick={async () => {
                  await navigator.clipboard.writeText(result.key);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </Button>
            </span>
          </Flash>
        </div>
      )}
      {result && !result.ok && (
        <div className="border-b border-line p-4">
          <Flash tone="danger">{result.error}</Flash>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="p-4 text-[13px] text-fg-muted">No keys yet. Create one for the CLI, the GitHub Action or the MCP server.</p>
      ) : (
        <ul>
          {rows.map((k) => (
            <li key={k.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-fg">{k.name}</div>
                <code className="font-mono text-xs text-fg-subtle">{k.prefix}••••••••</code>
                <div className="text-xs text-fg-subtle">
                  {k.scopes.join(", ")} · used {k.lastUsed}
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() => {
                  if (window.confirm(`Revoke "${k.name}"? Anything using it will stop working.`)) start(() => revokeApiKeyAction(k.id));
                }}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}
