/* Codes the rule engine receives. Thai wording lives in steps.ts.
   Source: CHAT_SCRIPT.md (S0–S11, R1–R4). */

export const SYMPTOM_CODES = [
  "cough_sore_throat",
  "cold_flu",
  "covid",
  "muscle_joint_pain",
  "bloating",
  "diarrhea",
  "constipation_hemorrhoid",
  "poor_appetite",
  "dizziness",
  "insomnia",
  "skin_wound",
  "numbness_paralysis",
] as const;
export type SymptomCode = (typeof SYMPTOM_CODES)[number];

export type AgeGroup = "child" | "adult" | "elderly";
export type Sex = "male" | "female";
export type PregnancyAnswer = "pregnant" | "breastfeeding" | "no" | "unsure";

export const CONDITIONS = [
  "hypertension",
  "diabetes",
  "kidney",
  "liver",
  "heart",
  "gallstones",
  "asthma",
  /** ภูมิแพ้ — treated as pollen allergy by the engine (safe default). */
  "allergy",
  /** เคยแพ้ยา สมุนไพร หรือยาทา — a past reaction, not a disease: adds a pharmacist note. */
  "allergy_history",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const MEDS = [
  "anticoagulant",
  "diabetes_meds",
  "bp_meds",
  "other_meds",
  "unsure_meds",
] as const;
export type Med = (typeof MEDS)[number];

/** Upper bound of the chosen range: 1 = ≤1 day, 3 = 2–3, 7 = 4–7, 8 = more than a week. */
export type Duration = 1 | 3 | 7 | 8;
export type RoutePref = "external" | "oral" | "both";
export type SkinType = "itch_bite" | "scrape" | "small_burn";
export type CovidAtk = "positive" | "negative" | "not_tested";

/** Extra lines shown on the result (S11 point 4) — text in steps.ts NOTE_TEXT. */
export type NoteCode =
  | "pregnancy_unsure"
  | "allergy_history"
  | "show_meds"
  | "ors"
  | "atk_advice"
  | "mental_health";

/** Filled once at consent (S0b). Last name is optional and never needed by the rules. */
export interface ProfileForm {
  firstName?: string;
  lastName?: string;
  /** ISO date, Christian era (YYYY-MM-DD). The form must convert a Buddhist-era year. */
  birthdate: string;
  sex: Sex;
}

/** A logged-in user's saved profile, loaded before the chat starts (S0c). */
export interface SavedProfile {
  firstName?: string;
  birthdate: string;
  sex: Sex;
  conditions: Condition[];
  meds: Med[];
}

/** The value each step stores. Multi-choice "ไม่มี" is an empty array. */
export interface AnswerMap {
  welcome: "line" | "guest";
  consent: "agree" | "decline";
  profile_form: ProfileForm;
  returning: "same" | "edit";
  who: "self" | "other";
  age: AgeGroup;
  sex: Sex;
  pregnancy: PregnancyAnswer;
  conditions: Condition[];
  meds: Med[];
  symptom: { code: SymptomCode; source: "grid" | "text" };
  symptom_confirm: "yes" | "pick";
  numbness_onset: "sudden" | "long";
  danger: ("breathing" | "chest_pain" | "high_fever_seizure" | "drowsy_confused" | "stroke_signs")[];
  duration: Duration;
  resp_flags: ("cough_blood" | "cannot_swallow")[];
  covid_atk: CovidAtk;
  muscle_flags: ("after_fall" | "hot_swollen")[];
  muscle_route: RoutePref;
  bloating_flags: ("severe_pain" | "vomiting")[];
  diarrhea_flags: ("bloody" | "fever" | "dehydrated")[];
  constipation_flags: ("severe_pain" | "heavy_bleeding" | "weight_loss")[];
  appetite_flags: "weight_loss"[];
  dizziness_flags: ("fainting" | "sudden_headache")[];
  insomnia_flags: "stress"[];
  skin_type: SkinType;
  skin_flags: ("infected" | "animal_bite" | "large_burn")[];
}
export type StepId = keyof AnswerMap;

/** Everything the recommendation engine needs. No names, no birthdate, no LINE ID. */
export interface Facts {
  forWhom: "self" | "other";
  ageGroup: Exclude<AgeGroup, "child">;
  sex: Sex;
  /** "ไม่แน่ใจ" counts as pregnant (safe default). */
  pregnant: boolean;
  /** Answered "ไม่แน่ใจ" — `pregnant` is true, but reasons should say "อาจตั้งครรภ์". */
  pregnancyUnsure: boolean;
  breastfeeding: boolean;
  conditions: Condition[];
  meds: Med[];
  /** What the user picked. */
  selectedSymptom: SymptomCode;
  /** What the engine should match on (covid with a negative or no ATK → cold_flu). */
  symptom: SymptomCode;
  durationDays: Duration;
  /** muscle_joint_pain only; "both" everywhere else. */
  route: RoutePref;
  skinType?: SkinType;
  covidAtk?: CovidAtk;
}

export type Outcome =
  | { kind: "redflag"; signs: string[] }
  | { kind: "refer"; reason: string }
  | { kind: "out"; reason: "child" }
  | { kind: "result"; facts: Facts; notes: NoteCode[] };
