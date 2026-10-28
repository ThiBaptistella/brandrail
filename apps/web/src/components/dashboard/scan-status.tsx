import { CheckCircleFillIcon, DotFillIcon, XCircleFillIcon, ClockIcon } from "@primer/octicons-react";
import type { ScanStatus } from "@/lib/mock";

export function ScanStatusIcon({ status, size = 16 }: { status: ScanStatus; size?: number }) {
  switch (status) {
    case "passed":
      return <CheckCircleFillIcon size={size} className="text-success" aria-label="Passed" />;
    case "failed":
      return <XCircleFillIcon size={size} className="text-danger" aria-label="Failed" />;
    case "running":
      return <DotFillIcon size={size} className="animate-pulse text-attention" aria-label="Running" />;
    default:
      return <ClockIcon size={size} className="text-fg-muted" aria-label="Queued" />;
  }
}
