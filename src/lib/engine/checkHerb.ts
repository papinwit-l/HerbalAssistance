/* Codes a herb may use. Data from MySQL is checked against these before the
   engine sees it: a herb with a code the app can't explain is left out. */

import symptomsData from "@/data/symptoms.json";
import { CONDITIONS, MEDS } from "@/lib/chat/types";
import type { Herb } from "./herbs";
import { UNASKED_LABEL } from "./recommend";

const SYMPTOMS = new Set(symptomsData.groups.map((g) => g.code));
const ASKED_CONDITIONS = new Set<string>(CONDITIONS);
const ASKED_MEDS = new Set<string>(MEDS);

/** Why this herb can't be used, in plain words for the log. Empty = fine. */
export function herbProblems(h: Herb): string[] {
  const out: string[] = [];
  for (const s of h.symptoms) if (!SYMPTOMS.has(s)) out.push(`unknown symptom "${s}"`);
  for (const r of [h.exclude_if, h.caution_if]) {
    for (const c of r.conditions) {
      if (!ASKED_CONDITIONS.has(c) && !(c in UNASKED_LABEL)) out.push(`unknown condition "${c}"`);
    }
    for (const m of r.meds) if (!ASKED_MEDS.has(m)) out.push(`unknown med "${m}"`);
    for (const f of r.flags) if (!(f in UNASKED_LABEL)) out.push(`unknown flag "${f}"`);
  }
  if (h.status !== "verified") out.push(`status is "${h.status}", not verified`);
  if (!h.sources.length || h.sources.some((s) => !s.page)) out.push("source without a page number");
  return out;
}
