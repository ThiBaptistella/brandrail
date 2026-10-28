import { Label } from "@brandrail/ui";

/** Marks pages still running on lib/mock.ts until the Checker and MCP server report real data. */
export function SampleDataBadge() {
  return (
    <Label tone="attention" title="Shown until your first real scan arrives">
      Sample data
    </Label>
  );
}
