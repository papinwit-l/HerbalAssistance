/* Symptom → herbs, then the safety filter. Plain TypeScript, no AI
   (PROJECT_GUIDE §1: "AI understands language; code decides").

   Pipeline for each herb in herbs.json:
     1. skip "todo" entries (no data)                      — silent
     2. must list the symptom group                        — silent
     3. route preference (muscle: ยาทา / ยากิน)            — silent
     4. skin_wound: must list the chosen skin type         — silent
     5. exclude_if  → removed, reason shown                — "ไม่แนะนำ … เพราะ …"
        caution_if  → removed too (app policy for villager self-care)
        max_days already passed for the reported duration → removed
     6. what the chat never asks (fever, peptic ulcer, …) → kept, listed on the
        card as "ห้ามใช้ถ้า…" so the user checks it themselves. */

import type { Condition, Duration, Facts, Med } from "@/lib/chat/types";
import { HERBS, type Herb } from "./herbs";

export interface Recommended {
  herb: Herb;
  /** Things the chat didn't ask that rule this herb out: "ห้ามใช้ถ้า …". */
  checkFirst: string[];
  /** The reported duration reaches the herb's max_days: say "see a doctor if not better". */
  nearMaxDays: boolean;
}

export interface Excluded {
  herb: Herb;
  /** Plain Thai, e.g. ["ตั้งครรภ์", "กินยาความดัน"]. */
  reasons: string[];
}

export interface Recommendation {
  recommended: Recommended[];
  excluded: Excluded[];
}

/* ─── Policy switches (decide with the team / data person) ─── */

/** S6 "ไม่แน่ใจ" counts as taking every medicine a herb warns about. Same idea as
    pregnancy "ไม่แน่ใจ" → pregnant: when unsure, play safe. */
export const UNSURE_MEDS_MATCH_ALL = true;

/** Asked conditions that also cover a narrower code used in herbs.json.
    "โรคหัวใจ" may be rheumatic heart disease, so it rules out those herbs too. */
const CONDITION_IMPLIES: Partial<Record<Condition, string[]>> = {
  heart: ["rheumatic_heart"],
};

/* ─── Thai wording ─── */

const CONDITION_REASON: Record<Condition, string> = {
  hypertension: "เป็นความดันสูง",
  diabetes: "เป็นเบาหวาน",
  kidney: "เป็นโรคไต",
  liver: "เป็นโรคตับ",
  heart: "เป็นโรคหัวใจ",
  gallstones: "เป็นนิ่วในถุงน้ำดี",
  allergy_history: "เคยแพ้ยาหรือสมุนไพร",
};

const MED_REASON: Record<Med, string> = {
  anticoagulant: "กินยาละลายลิ่มเลือด",
  diabetes_meds: "กินยาเบาหวาน",
  bp_meds: "กินยาความดัน",
  other_meds: "กินยาอื่นเป็นประจำ",
  unsure_meds: "ไม่แน่ใจว่ากินยาอะไรอยู่",
};

/** herbs.json codes the chat never asks about → shown on the card instead. */
export const UNASKED_LABEL: Record<string, string> = {
  // conditions
  peptic_ulcer: "เป็นโรคกระเพาะ / แผลในกระเพาะอาหาร",
  rheumatic_heart: "เคยเป็นโรคหัวใจรูมาติก",
  bile_duct_obstruction: "ท่อน้ำดีอุดตัน",
  bowel_obstruction: "ลำไส้อุดตัน",
  ibd: "ลำไส้อักเสบ",
  // flags
  fever: "มีไข้",
  suspected_dengue: "สงสัยไข้เลือดออก",
  pollen_allergy: "แพ้เกสรดอกไม้",
  capsaicin_allergy: "แพ้พริก",
  menstruating: "มีประจำเดือน",
  heavy_menstruation: "ประจำเดือนมามากกว่าปกติ",
  postpartum_bleeding: "มีเลือดออกหลังคลอด",
  open_wound: "มีแผลเปิดบริเวณนั้น",
  acute_inflammation_24h: "บวม แดง ร้อน ภายใน 24 ชั่วโมงแรก",
};

const DURATION_LABEL: Record<Duration, string> = {
  1: "ไม่เกิน 1 วัน",
  3: "2–3 วัน",
  7: "4–7 วัน",
  8: "มากกว่า 1 สัปดาห์",
};
/** Fewest days each S9 answer can mean. */
const DURATION_MIN: Record<Duration, number> = { 1: 0, 3: 2, 7: 4, 8: 8 };

/* ─── Engine ─── */

export function recommend(facts: Facts, herbs: Herb[] = HERBS): Recommendation {
  const recommended: Recommended[] = [];
  const excluded: Excluded[] = [];

  for (const herb of herbs) {
    if (!matches(herb, facts)) continue;

    const reasons = safetyReasons(herb, facts);
    if (reasons.length) {
      excluded.push({ herb, reasons });
      continue;
    }
    recommended.push({
      herb,
      checkFirst: unasked(herb),
      nearMaxDays: herb.max_days !== null && facts.durationDays >= herb.max_days,
    });
  }
  return { recommended, excluded };
}

/** "ไม่แนะนำ ยาฟ้าทะลายโจร เพราะตั้งครรภ์ และกินยาความดันค่ะ" */
export function excludedSentence(e: Excluded): string {
  return `ไม่แนะนำ${e.herb.name_th} เพราะ${e.reasons.join(" และ")}ค่ะ`;
}

function matches(herb: Herb, f: Facts): boolean {
  if (!herb.symptoms.includes(f.symptom)) return false;
  if (f.route !== "both" && herb.route !== f.route) return false;
  if (f.symptom === "skin_wound") {
    return f.skinType !== undefined && (herb.skin_types ?? []).includes(f.skinType);
  }
  return true;
}

function safetyReasons(herb: Herb, f: Facts): string[] {
  const ex = herb.exclude_if;
  const ca = herb.caution_if;
  const reasons: string[] = [];
  const add = (r: string) => {
    if (!reasons.includes(r)) reasons.push(r);
  };

  if (f.pregnant && (ex.pregnant || ca.pregnant)) add(f.pregnancyUnsure ? "อาจตั้งครรภ์" : "ตั้งครรภ์");
  if (f.breastfeeding && (ex.breastfeeding || ca.breastfeeding)) add("ให้นมลูก");
  if (f.ageGroup === "elderly" && ca.elderly) add("อายุ 60 ปีขึ้นไป");

  // Users here are 12+ (children stop at S2), so only a higher age limit can apply.
  const ageLimit = Math.max(ex.age_below ?? 0, ca.age_below ?? 0);
  if (ageLimit > 12) add(`ยานี้ไม่แนะนำสำหรับอายุต่ำกว่า ${ageLimit} ปี`);

  const herbConditions = [...ex.conditions, ...ca.conditions];
  for (const c of f.conditions) {
    const covers = [c, ...(CONDITION_IMPLIES[c] ?? [])];
    if (covers.some((code) => herbConditions.includes(code))) add(CONDITION_REASON[c]);
  }

  const herbMeds = [...ex.meds, ...ca.meds];
  for (const m of f.meds) {
    const hit =
      herbMeds.includes(m) || (m === "unsure_meds" && UNSURE_MEDS_MATCH_ALL && herbMeds.length > 0);
    if (hit) add(MED_REASON[m]);
  }

  if (herb.max_days !== null && DURATION_MIN[f.durationDays] >= herb.max_days) {
    add(`เป็นมาแล้ว ${DURATION_LABEL[f.durationDays]} เกินที่ยานี้แนะนำ (ใช้ไม่เกิน ${herb.max_days} วัน)`);
  }

  return reasons;
}

function unasked(herb: Herb): string[] {
  const codes = [
    ...herb.exclude_if.conditions,
    ...herb.caution_if.conditions,
    ...herb.exclude_if.flags,
    ...herb.caution_if.flags,
  ];
  const labels = codes.map((c) => UNASKED_LABEL[c]).filter((l): l is string => Boolean(l));
  return [...new Set(labels)];
}
