import { CircleCheck, CircleDot, CircleX, Clock, CircleAlert } from "lucide-react";
import type { ScanStatus } from "@/lib/data";

export function ScanStatusIcon({ status, size = 16 }: { status: ScanStatus; size?: number }) {
  switch (status) {
    case "passed":
      return <CircleCheck size={size} className="text-success" aria-label="Passed" />;
    case "failed":
      return <CircleX size={size} className="text-danger" aria-label="Below threshold" />;
    case "running":
      return <CircleDot size={size} className="animate-pulse text-attention" aria-label="Running" />;
    case "error":
      return <CircleAlert size={size} className="text-danger" aria-label="Error" />;
    default:
      return <Clock size={size} className="text-fg-muted" aria-label="Queued" />;
  }
}
