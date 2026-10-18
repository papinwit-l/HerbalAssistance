import "server-only";
import { loadHerbsFrom, type HerbLoad } from "./herbSource";

/** Server-only: the token never reaches the browser. */
export async function loadHerbs(): Promise<HerbLoad> {
  const load = await loadHerbsFrom({
    url: process.env.HERBS_EXPORT_URL,
    token: process.env.HERBS_EXPORT_TOKEN,
    revalidate: Number(process.env.HERBS_REVALIDATE_SECONDS ?? 300),
  });
  if (load.problems.length) console.warn(`[herbs] source=${load.source}`, load.problems);
  return load;
}
