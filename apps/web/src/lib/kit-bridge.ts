/**
 * The dashboard's live library and Brand Kit preview: kit components styled by a Brand Kit.
 * The mapping lives in the engine (shared with `brandrail init`, which writes it into brandrail.tokens.css).
 */
import { kitBridgeCss as engineKitBridgeCss } from "@brandrail/engine";
import { toDtcg, type BrandKitState } from "./brand-kit";

export function kitBridgeCss(kit: BrandKitState, scopeId: string): string {
  return engineKitBridgeCss(toDtcg(kit), { scope: `#${scopeId}` });
}
