/* Every question น้องขมิ้น asks: bubbles, answer buttons, and what each answer
   triggers. Wording follows CHAT_SCRIPT.md; change copy here, not in components.
   Flag answers marked refer/redflag are a draft — the data person should check
   them against a credible source. */

import symptomsData from "@/data/symptoms.json";
import { SYMPTOM_CODES, type NoteCode, type StepId, type SymptomCode } from "./types";

export type Effect =
  | { kind: "redflag" }
  | { kind: "refer"; reason: string }
  | { kind: "note"; note: NoteCode };

export interface Option {
  value: string | number;
  label: string;
  effect?: Effect;
}

export type StepInput =
  /** Tap sends immediately. */
  | { kind: "single"; options: Option[] }
  /** Toggle chips + [ยืนยัน]. `noneLabel` is the "ไม่มี" chip; choosing it sends []. */
  | { kind: "multi"; options: Option[]; noneLabel: string }
  /** Icon grid + "พิมพ์/พูดอาการเอง". Value: { code, source }. */
  | { kind: "symptom"; options: (Option & { icon: string })[] }
  /** Consent card with an unticked checkbox (S0b). */
  | { kind: "consent"; options: Option[] }
  /** Name (optional), birthdate, sex. Value: ProfileForm. */
  | { kind: "profile_form" };

export interface PromptVars {
  firstName?: string;
  symptomLabel?: string;
}

export interface StepDef {
  prompt: (vars: PromptVars) => string[];
  input: StepInput;
}

const refer = (reason: string): Effect => ({ kind: "refer", reason });
const REDFLAG: Effect = { kind: "redflag" };
const note = (code: NoteCode): Effect => ({ kind: "note", note: code });

/** Flag options refer with the answer itself as the reason ("เพราะ: ไอเป็นเลือด"). */
const flag = (value: string, label: string, effect: Effect = refer(label)): Option => ({
  value,
  label,
  effect,
});

const SYMPTOM_OPTIONS = symptomsData.groups
  .filter((g) => g.enabled && (SYMPTOM_CODES as readonly string[]).includes(g.code))
  .map((g) => ({ value: g.code, label: g.label_th, icon: g.icon }));

export function symptomLabel(code: SymptomCode): string {
  return symptomsData.groups.find((g) => g.code === code)?.label_th ?? code;
}

const ASK_FLAGS = ["มีอาการเหล่านี้ไหมคะ?"];

export const STEPS: { [K in StepId]: StepDef } = {
  /* ─── S0 ─── */
  welcome: {
    prompt: () => [
      "สวัสดีค่ะ หนูชื่อน้องขมิ้น ผู้ช่วยแนะนำยาสมุนไพรในบัญชียาหลักแห่งชาติค่ะ",
      "หนูจะถามคำถามสั้นๆ เพื่อแนะนำสมุนไพรที่ปลอดภัยกับคุณ",
      "หนูช่วยแนะนำเบื้องต้นเท่านั้น ไม่ได้แทนแพทย์หรือเภสัชกรนะคะ",
    ],
    input: {
      kind: "single",
      options: [
        { value: "line", label: "เข้าสู่ระบบด้วย LINE" },
        { value: "guest", label: "ลองใช้โดยไม่บันทึกข้อมูล" },
      ],
    },
  },
  consent: {
    prompt: () => ["ก่อนเริ่ม หนูขออนุญาตเก็บข้อมูลสุขภาพของคุณนะคะ"],
    input: {
      kind: "consent",
      options: [
        { value: "agree", label: "ยินยอม" },
        { value: "decline", label: "ไม่ยินยอม ใช้แบบไม่บันทึก" },
      ],
    },
  },
  profile_form: {
    prompt: () => ["ขอข้อมูลสั้นๆ ไว้ใช้ครั้งต่อไปนะคะ ชื่อไม่บังคับค่ะ"],
    input: { kind: "profile_form" },
  },
  returning: {
    prompt: ({ firstName }) => [
      firstName ? `สวัสดีค่ะคุณ${firstName}` : "สวัสดีค่ะ",
      "ข้อมูลสุขภาพของคุณยังเหมือนเดิมไหมคะ?",
    ],
    input: {
      kind: "single",
      options: [
        { value: "same", label: "เหมือนเดิม" },
        { value: "edit", label: "แก้ไข" },
      ],
    },
  },

  /* ─── S1–S6 profile & safety ─── */
  who: {
    prompt: () => ["วันนี้ถามให้ใครคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "self", label: "ตัวเอง" },
        { value: "other", label: "คนในครอบครัว/คนอื่น" },
      ],
    },
  },
  age: {
    prompt: () => ["อายุเท่าไหร่คะ?"],
    input: {
      kind: "single",
      options: [
        { value: "child", label: "ต่ำกว่า 12 ปี" },
        { value: "adult", label: "12–59 ปี" },
        { value: "elderly", label: "60 ปีขึ้นไป" },
      ],
    },
  },
  sex: {
    prompt: () => ["เพศอะไรคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "male", label: "ชาย" },
        { value: "female", label: "หญิง" },
      ],
    },
  },
  pregnancy: {
    prompt: () => ["ตอนนี้ตั้งครรภ์หรือให้นมลูกอยู่ไหมคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "pregnant", label: "ตั้งครรภ์" },
        { value: "breastfeeding", label: "ให้นมลูก" },
        { value: "no", label: "ไม่ใช่" },
        { value: "unsure", label: "ไม่แน่ใจ", effect: note("pregnancy_unsure") },
      ],
    },
  },
  conditions: {
    prompt: () => ["มีโรคประจำตัวไหมคะ? (เลือกได้หลายข้อ)"],
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        { value: "hypertension", label: "ความดันสูง" },
        { value: "diabetes", label: "เบาหวาน" },
        { value: "kidney", label: "โรคไต" },
        { value: "liver", label: "โรคตับ" },
        { value: "heart", label: "โรคหัวใจ" },
        { value: "gallstones", label: "นิ่วในถุงน้ำดี" },
        { value: "asthma", label: "หอบหืด" },
        { value: "allergy", label: "ภูมิแพ้ / แพ้เกสรดอกไม้" },
        { value: "allergy_history", label: "เคยแพ้ยา สมุนไพร หรือยาทา", effect: note("allergy_history") },
      ],
    },
  },
  meds: {
    prompt: () => ["ตอนนี้กินยาอะไรเป็นประจำไหมคะ? (เลือกได้หลายข้อ)"],
    input: {
      kind: "multi",
      noneLabel: "ไม่ได้กินยา",
      options: [
        { value: "anticoagulant", label: "ยาละลายลิ่มเลือด / ยาป้องกันเส้นเลือดอุดตัน" },
        { value: "diabetes_meds", label: "ยาเบาหวาน" },
        { value: "bp_meds", label: "ยาความดัน" },
        { value: "other_meds", label: "ยาอื่นๆ ที่กินประจำ", effect: note("show_meds") },
        { value: "unsure_meds", label: "ไม่แน่ใจ", effect: note("show_meds") },
      ],
    },
  },

  /* ─── S7–S9 symptom ─── */
  symptom: {
    prompt: () => [
      "วันนี้ไม่สบายตรงไหนคะ? ถ้ามีหลายอาการ เลือกอาการที่เป็นมากที่สุดก่อนนะคะ",
    ],
    input: { kind: "symptom", options: SYMPTOM_OPTIONS },
  },
  symptom_confirm: {
    prompt: ({ symptomLabel }) => [`หมายถึง ${symptomLabel ?? ""} ใช่ไหมคะ?`],
    input: {
      kind: "single",
      options: [
        { value: "yes", label: "ใช่" },
        { value: "pick", label: "เลือกเอง" },
      ],
    },
  },
  numbness_onset: {
    prompt: () => ["เพิ่งเป็นทันทีวันนี้ไหมคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "sudden", label: "ใช่", effect: REDFLAG },
        { value: "long", label: "เป็นมานานแล้ว" },
      ],
    },
  },
  danger: {
    prompt: () => ["มีอาการเหล่านี้ร่วมด้วยไหมคะ?"],
    input: {
      kind: "multi",
      noneLabel: "ไม่มีเลย",
      options: [
        flag("breathing", "หายใจลำบาก หอบเหนื่อย", REDFLAG),
        flag("chest_pain", "เจ็บแน่นหน้าอก", REDFLAG),
        flag("high_fever_seizure", "ไข้สูงมาก หรือชัก", REDFLAG),
        flag("drowsy_confused", "ซึม สับสน ปลุกไม่ค่อยตื่น", REDFLAG),
        flag("stroke_signs", "แขนขาอ่อนแรงข้างเดียว ปากเบี้ยว พูดไม่ชัด", REDFLAG),
      ],
    },
  },
  duration: {
    prompt: () => ["เป็นมากี่วันแล้วคะ?"],
    input: {
      kind: "single",
      options: [
        { value: 1, label: "ไม่เกิน 1 วัน" },
        { value: 3, label: "2–3 วัน" },
        { value: 7, label: "4–7 วัน" },
        {
          value: 8,
          label: "มากกว่า 1 สัปดาห์",
          effect: refer("เป็นมากกว่า 1 สัปดาห์แล้ว ควรให้แพทย์ตรวจหาสาเหตุ"),
        },
      ],
    },
  },

  /* ─── S10 group questions ─── */
  resp_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("cough_blood", "ไอเป็นเลือด"),
        flag("cannot_swallow", "เจ็บคอมากจนกลืนน้ำไม่ได้"),
        flag("throat_pus", "มีตุ่มหนองในคอ ไข้สูง หนาวสั่น"),
      ],
    },
  },
  covid_atk: {
    prompt: () => ["ตรวจ ATK แล้วผลเป็นอย่างไรคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "positive", label: "ผลบวก" },
        { value: "negative", label: "ผลลบ" },
        { value: "not_tested", label: "ยังไม่ได้ตรวจ", effect: note("atk_advice") },
      ],
    },
  },
  muscle_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("after_fall", "ปวดหลังล้มหรืออุบัติเหตุ"),
        flag("hot_swollen", "ข้อบวม แดง ร้อน"),
      ],
    },
  },
  muscle_route: {
    prompt: () => ["สะดวกใช้ยาแบบไหนคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "external", label: "ยาทา/ยาประคบ" },
        { value: "oral", label: "ยากิน" },
        { value: "both", label: "ได้ทั้งสองแบบ" },
      ],
    },
  },
  bloating_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [flag("severe_pain", "ปวดท้องรุนแรง"), flag("vomiting", "อาเจียนมาก")],
    },
  },
  diarrhea_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("bloody", "ถ่ายเป็นเลือดหรือมูกเลือด"),
        flag("fever", "มีไข้"),
        flag("dehydrated", "อ่อนเพลียมาก ปากแห้ง ปัสสาวะน้อย"),
      ],
    },
  },
  constipation_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("severe_pain", "ปวดท้องรุนแรง"),
        flag("heavy_bleeding", "ถ่ายเป็นเลือดมาก"),
        flag("weight_loss", "น้ำหนักลดโดยไม่ทราบสาเหตุ"),
      ],
    },
  },
  appetite_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [flag("weight_loss", "น้ำหนักลดมากโดยไม่ทราบสาเหตุ")],
    },
  },
  dizziness_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("fainting", "หน้ามืดจะเป็นลม หรือเป็นลมไปแล้ว"),
        flag("sudden_headache", "ปวดหัวรุนแรงทันที", REDFLAG),
      ],
    },
  },
  insomnia_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      /* Gentle refer: herbs are still shown, plus the 1323 hotline note. */
      options: [flag("stress", "เครียดหรือเศร้ามากจนใช้ชีวิตลำบาก", note("mental_health"))],
    },
  },
  skin_type: {
    prompt: () => ["เป็นแบบไหนคะ?"],
    input: {
      kind: "single",
      options: [
        { value: "itch_bite", label: "ผื่นคัน / แมลงกัด" },
        { value: "scrape", label: "แผลถลอก / แผลเล็ก" },
        { value: "small_burn", label: "ไฟไหม้ น้ำร้อนลวก แผลเล็ก" },
      ],
    },
  },
  skin_flags: {
    prompt: () => ASK_FLAGS,
    input: {
      kind: "multi",
      noneLabel: "ไม่มี",
      options: [
        flag("infected", "แผลลึก มีหนอง หรือบวมแดงลามออก"),
        flag("animal_bite", "ถูกสัตว์กัด"),
        flag("large_burn", "แผลไฟไหม้ใหญ่กว่าฝ่ามือ หรืออยู่ที่หน้า มือ เท้า ข้อพับ"),
      ],
    },
  },
};

/** S10 questions per group, in order. numbness_paralysis has its own branch in flow.ts. */
export const GROUP_STEPS: Record<SymptomCode, StepId[]> = {
  cough_sore_throat: ["resp_flags"],
  cold_flu: ["resp_flags"],
  covid: ["covid_atk", "resp_flags"],
  muscle_joint_pain: ["muscle_flags", "muscle_route"],
  bloating: ["bloating_flags"],
  diarrhea: ["diarrhea_flags"],
  constipation_hemorrhoid: ["constipation_flags"],
  poor_appetite: ["appetite_flags"],
  dizziness: ["dizziness_flags"],
  insomnia: ["insomnia_flags"],
  skin_wound: ["skin_type", "skin_flags"],
  numbness_paralysis: [],
};

export const NOTE_TEXT: Record<NoteCode, string> = {
  pregnancy_unsure: "ถ้าไม่แน่ใจว่าตั้งครรภ์ ควรตรวจก่อนใช้ยานะคะ",
  allergy_history: "เคยแพ้ยา สมุนไพร หรือยาทา ควรให้เภสัชกรตรวจสอบก่อนใช้นะคะ",
  show_meds: "นำยาที่กินอยู่ไปให้เภสัชกรดูก่อนใช้สมุนไพรนะคะ",
  ors: "ดื่มน้ำเกลือแร่ (ORS) บ่อยๆ นะคะ",
  atk_advice: "ควรตรวจ ATK เพื่อยืนยันผลนะคะ",
  mental_health: "ลองคุยกับแพทย์ หรือโทรสายด่วนสุขภาพจิต 1323 ได้ตลอด 24 ชั่วโมงค่ะ",
};

export const REFER_TEXT = {
  numbness: "อาการชาจากอัมพฤกษ์-อัมพาต ควรให้แพทย์หรือ รพ.สต. ดูแลต่อเนื่อง",
  covidRisk: "ผลตรวจโควิดเป็นบวกและอยู่ในกลุ่มเสี่ยง ควรติดต่อสถานพยาบาล",
} as const;

export const STROKE_SIGN = "อาการชาหรืออ่อนแรงที่เพิ่งเป็นทันที";
