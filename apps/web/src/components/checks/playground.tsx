"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Play, OctagonX, TriangleAlert, Info } from "lucide-react";
import { Box, BoxHeader, Button, Label, Select, cn } from "@brandrail/ui";
import { runPlaygroundAction, type PlaygroundResult } from "@/app/actions/playground";

const SAMPLE = `import { Dialog } from "@mui/material";

export function VendorCard({ vendor }) {
  return (
    <div className="p-4 bg-blue-500 rounded-[10px]" style={{ padding: 13, color: "#3b82f6" }}>
      <h2 style={{ fontFamily: "Comic Sans MS" }}>{vendor.name}</h2>
      <img src={vendor.logo} />
      <input placeholder="Notes" />
      <button className="text-gray-700">Approve</button>
    </div>
  );
}
`;

const sevIcon = {
  error: <OctagonX size={15} className="text-danger" />,
  warning: <TriangleAlert size={15} className="text-attention" />,
  info: <Info size={15} className="text-accent" />,
};

export function Playground() {
  const [code, setCode] = useState(SAMPLE);
  const [ext, setExt] = useState("tsx");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [pending, start] = useTransition();
  const run = () => start(async () => setResult(await runPlaygroundAction(code, ext)));
  const lines = code.split("\n");

  return (
    <Box>
      <BoxHeader className="flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-medium text-fg">Try the Checker</h2>
          <p className="text-xs text-fg-subtle">Paste UI code and check it against your Brand Kit. Nothing is saved.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label="Language" value={ext} onChange={(e) => setExt(e.target.value)} className="h-8 w-24 text-xs">
            {["tsx", "jsx", "vue", "svelte", "html", "css", "scss"].map((x) => (
              <option key={x} value={x}>.{x}</option>
            ))}
          </Select>
          <Button variant="primary" onClick={run} disabled={pending || !code.trim()} leadingIcon={<Play size={13} />}>
            {pending ? "Checking…" : "Run check"}
          </Button>
        </div>
      </BoxHeader>
      <div className="grid lg:grid-cols-2">
        <textarea
          aria-label="Code to check"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[320px] resize-y border-b border-line bg-canvas-inset p-4 font-mono text-xs leading-5 text-fg outline-none lg:border-r lg:border-b-0"
        />
        <div className="max-h-[480px] min-h-[320px] overflow-auto">
          {!result && <p className="p-6 text-sm text-fg-subtle">Run the check to see violations and fixes here.</p>}
          {result && !result.ok && <p className="p-6 text-sm text-danger">{result.error}</p>}
          {result?.ok && (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                <span className={cn("text-2xl font-normal", result.report.score >= 80 ? "text-success" : result.report.score >= 65 ? "text-attention" : "text-danger")}>
                  {result.report.score}
                  <span className="text-sm text-fg-subtle">/100</span>
                </span>
                <Label tone="danger">{result.report.counts.error} errors</Label>
                <Label tone="attention">{result.report.counts.warning} warnings</Label>
                <Label tone="accent">{result.report.counts.info} info</Label>
                <span className="ml-auto text-xs text-fg-subtle">
                  {result.kitVersion ? `Brand Kit v${result.kitVersion}` : "Starter Brand Kit (publish yours to use it)"}
                </span>
              </div>
              {result.report.violations.length === 0 ? (
                <p className="p-6 text-sm text-success">No violations. This code follows the Brand Kit.</p>
              ) : (
                <ul>
                  {result.report.violations.map((v, i) => (
                    <li key={i} className="flex gap-3 border-b border-line px-4 py-3 text-[13px] last:border-0">
                      <span className="mt-0.5">{sevIcon[v.severity]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-xs text-fg-subtle">L{v.line}</span>
                          <span className="text-fg">{v.message}</span>
                          <code className="rounded bg-fg-muted/10 px-1.5 py-px font-mono text-[11px] text-fg-muted">{v.ruleId}</code>
                        </div>
                        <pre className="mt-1 truncate font-mono text-[11px] text-fg-subtle">{lines[v.line - 1]?.trim()}</pre>
                        {v.suggestion && (
                          <div className="mt-1 flex items-start gap-1.5 text-success">
                            <Lightbulb size={13} className="mt-0.5 shrink-0" /> {v.suggestion}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </Box>
  );
}
