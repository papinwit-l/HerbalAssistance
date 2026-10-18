/* Where the engine's herb list comes from.

   Live: the team's PHP endpoint api/herbs_export.php, which reads MySQL — the one
   place herbs are edited. The bundled src/data/herbs.json is the fallback: used when
   the URL isn't set, the server is down, or the payload is broken. Herbs that fail
   the checks in checkHerb.ts are dropped one by one (and logged); the rest are used. */

import { HerbFileSchema, HERBS, type Herb } from "./herbs";
import { herbProblems } from "./checkHerb";

export interface HerbLoad {
  herbs: Herb[];
  source: "api" | "bundled";
  /** "id: reason" for every herb left out, plus the reason for a fallback. */
  problems: string[];
}

export interface LoadOptions {
  url?: string;
  token?: string;
  /** Seconds Next.js may serve a cached copy before asking the PHP server again. */
  revalidate?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function loadHerbsFrom(opts: LoadOptions): Promise<HerbLoad> {
  const bundled = (why: string): HerbLoad => ({ herbs: HERBS, source: "bundled", problems: [why] });
  if (!opts.url) return bundled("HERBS_EXPORT_URL not set");

  let body: unknown;
  try {
    const url = new URL(opts.url);
    if (opts.token) url.searchParams.set("token", opts.token);
    const res = await (opts.fetchImpl ?? fetch)(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
      next: { revalidate: opts.revalidate ?? 300 },
    } as RequestInit);
    if (!res.ok) return bundled(`HTTP ${res.status}`);
    body = await res.json();
  } catch (e) {
    return bundled(`fetch failed: ${(e as Error).message}`);
  }

  const parsed = HerbFileSchema.safeParse(body);
  if (!parsed.success) return bundled(`bad shape: ${parsed.error.issues[0]?.message ?? "invalid"}`);

  const problems: string[] = [];
  const herbs: Herb[] = [];
  for (const h of parsed.data.herbs) {
    if (h.status === "todo") continue;
    const why = herbProblems(h);
    if (why.length) problems.push(`${h.id}: ${why.join(", ")}`);
    else herbs.push(h);
  }
  if (!herbs.length) return bundled(`no usable herbs (${problems.length} dropped)`);
  return { herbs, source: "api", problems };
}
