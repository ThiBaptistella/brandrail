import { isSupabaseConfigured } from "@/lib/env";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-attention/40 bg-attention-subtle px-4 py-2 text-center text-xs text-fg">
      <strong>Demo mode</strong> — Supabase isn&apos;t configured, so any email and password signs you in and nothing is
      stored. Add your keys to <code className="font-mono">apps/web/.env.local</code> to go live.
    </div>
  );
}
