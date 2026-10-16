/* The chat as a pure state machine — no React, no network.

   State is just the list of answers in the order they were given. Everything
   else (which question comes next, red flag / refer / out / result) is derived
   from it by `resolve`, so going back is simply "drop the answers from there on"
   (`editFrom`) and the flow can never get out of sync.

   Usage in a component:
     const [state, setState] = useState(start);
     const view = current(state, ctx);          // what to render now
     setState(answer(state, view.step, value, ctx));
     setState(editFrom(state, "conditions"));   // user tapped an earlier answer

   Safety order (PROJECT_GUIDE §1): red flags are checked before anything else
   ends the flow, and safety questions (S4–S6) are asked in guest and
   logged-in modes alike. */

import {
  GROUP_STEPS,
  NOTE_TEXT,
  REFER_TEXT,
  STEPS,
  STROKE_SIGN,
  symptomLabel,
  type Option,
  type PromptVars,
  type StepInput,
} from "./steps";
import {
  SYMPTOM_CODES,
  type AgeGroup,
  type AnswerMap,
  type Condition,
  type Med,
  type NoteCode,
  type Outcome,
  type PregnancyAnswer,
  type ProfileForm,
  type SavedProfile,
  type Sex,
  type StepId,
  type SymptomCode,
} from "./types";

export interface Entry {
  step: StepId;
  value: unknown;
}

export interface ChatState {
  readonly entries: readonly Entry[];
}

export interface FlowContext {
  /** Logged-in user's saved profile, if they have one (→ S0c instead of S0b). */
  savedProfile?: SavedProfile;
  /** For computing age from birthdate. Defaults to now. */
  today?: Date;
}

export type Resolution =
  | { type: "ask"; step: StepId }
  | { type: "outcome"; outcome: Outcome };

export type View =
  | { type: "ask"; step: StepId; bubbles: string[]; input: StepInput; progress: number }
  | { type: "outcome"; outcome: Outcome; progress: 1 };

type Answers = Partial<AnswerMap>;

interface KnownProfile {
  ageGroup: AgeGroup;
  sex: Sex;
  conditions?: Condition[];
  meds?: Med[];
}

/* ───────────────────────── public API ───────────────────────── */

export function start(): ChatState {
  return { entries: [] };
}

/** Next question, or how the chat ends. */
export function resolve(state: ChatState, ctx: FlowContext = {}): Resolution {
  const a = answersOf(state);
  const today = ctx.today ?? new Date();
  const notes = new Set<NoteCode>();
  const ask = (step: StepId): Resolution => ({ type: "ask", step });
  const end = (outcome: Outcome): Resolution => ({ type: "outcome", outcome });
  const collect = (step: StepId, value: unknown) => {
    for (const o of chosen(step, value)) if (o.effect?.kind === "note") notes.add(o.effect.note);
  };

  /* S0 — guest or LINE */
  if (a.welcome === undefined) return ask("welcome");

  let own: KnownProfile | undefined; // the logged-in user's own data
  let reuseHealth = false; // S0c [เหมือนเดิม]
  if (a.welcome === "line") {
    if (ctx.savedProfile) {
      if (a.returning === undefined) return ask("returning");
      own = fromSaved(ctx.savedProfile, today);
      reuseHealth = a.returning === "same";
    } else {
      if (a.consent === undefined) return ask("consent");
      if (a.consent === "agree") {
        if (a.profile_form === undefined) return ask("profile_form");
        own = fromForm(a.profile_form, today);
      }
      // decline → continues exactly like a guest
    }
  }

  /* S1 — [แก้ไข] on S0c means editing your own data, so "who" is implied. */
  let forWhom: "self" | "other";
  if (a.returning === "edit") forWhom = "self";
  else {
    if (a.who === undefined) return ask("who");
    forWhom = a.who;
  }
  // Someone else: always ask everything, never use the user's own data.
  const known = forWhom === "self" ? own : undefined;
  const reuse = forWhom === "self" && reuseHealth;

  /* S2 age */
  const ageGroup = known?.ageGroup ?? a.age;
  if (ageGroup === undefined) return ask("age");
  if (ageGroup === "child") return end({ kind: "out", reason: "child" });

  /* S3 sex */
  const sex = known?.sex ?? a.sex;
  if (sex === undefined) return ask("sex");

  /* S4 pregnancy — adult women only. Asked even when the saved profile is
     reused: pregnancy changes and isn't part of the saved profile. */
  let pregnancy: PregnancyAnswer = "no";
  if (sex === "female" && ageGroup === "adult") {
    if (a.pregnancy === undefined) return ask("pregnancy");
    pregnancy = a.pregnancy;
    collect("pregnancy", pregnancy);
  }

  /* S5 conditions, S6 medicines */
  const conditions = reuse ? known?.conditions : a.conditions;
  if (conditions === undefined) return ask("conditions");
  collect("conditions", conditions);

  const meds = reuse ? known?.meds : a.meds;
  if (meds === undefined) return ask("meds");
  collect("meds", meds);

  /* S7 main symptom (+ confirm when it came from free text) */
  if (a.symptom === undefined) return ask("symptom");
  if (a.symptom.source === "text" && a.symptom_confirm === undefined) return ask("symptom_confirm");
  const selected = a.symptom.code;

  if (selected === "numbness_paralysis") {
    if (a.numbness_onset === undefined) return ask("numbness_onset");
    if (a.numbness_onset === "sudden") return end({ kind: "redflag", signs: [STROKE_SIGN] });
    // Long-standing: still check danger signs (S8) before referring.
  }

  /* S8 danger signs — any one ends in RED FLAG */
  if (a.danger === undefined) return ask("danger");
  const stop = stopFor("danger", a.danger);
  if (stop) return end(stop);

  if (selected === "numbness_paralysis") return end({ kind: "refer", reason: REFER_TEXT.numbness });

  /* S9 duration */
  if (a.duration === undefined) return ask("duration");
  const durationStop = stopFor("duration", a.duration);
  if (durationStop) return end(durationStop);

  /* S10 group questions, in order; a flag ends the flow right away */
  let symptom: SymptomCode = selected;
  for (const step of GROUP_STEPS[selected]) {
    const value = a[step];
    if (value === undefined) return ask(step);
    const groupStop = stopFor(step, value);
    if (groupStop) return end(groupStop);
    collect(step, value);

    if (step === "covid_atk") {
      const riskGroup =
        ageGroup === "elderly" || conditions.some((c) => !COVID_NOT_RISK.includes(c));
      if (value === "positive" && riskGroup) {
        return end({ kind: "refer", reason: REFER_TEXT.covidRisk });
      }
      if (value !== "positive") symptom = "cold_flu";
    }
  }
  if (selected === "diarrhea") notes.add("ors");

  /* S11 */
  return end({
    kind: "result",
    notes: [...notes],
    facts: {
      forWhom,
      ageGroup,
      sex,
      pregnant: pregnancy === "pregnant" || pregnancy === "unsure",
      pregnancyUnsure: pregnancy === "unsure",
      breastfeeding: pregnancy === "breastfeeding",
      conditions,
      meds,
      selectedSymptom: selected,
      symptom,
      durationDays: a.duration,
      route: selected === "muscle_joint_pain" ? (a.muscle_route ?? "both") : "both",
      skinType: selected === "skin_wound" ? a.skin_type : undefined,
      covidAtk: selected === "covid" ? a.covid_atk : undefined,
    },
  });
}

/** Everything a component needs to render the current turn. */
export function current(state: ChatState, ctx: FlowContext = {}): View {
  const r = resolve(state, ctx);
  if (r.type === "outcome") return { type: "outcome", outcome: r.outcome, progress: 1 };
  const def = STEPS[r.step];
  return {
    type: "ask",
    step: r.step,
    bubbles: def.prompt(promptVars(state, ctx)),
    input: def.input,
    progress: PROGRESS[r.step],
  };
}

/** Record an answer to the question currently being asked. Throws on anything else. */
export function answer<K extends StepId>(
  state: ChatState,
  step: K,
  value: AnswerMap[K],
  ctx: FlowContext = {},
): ChatState {
  const r = resolve(state, ctx);
  if (r.type !== "ask" || r.step !== step) {
    throw new Error(`The chat is not asking "${step}" right now`);
  }
  validate(step, value, ctx.today ?? new Date());

  // [เลือกเอง] after free text: forget the parsed symptom and show the grid again.
  if (step === "symptom_confirm" && value === "pick") {
    return { entries: state.entries.filter((e) => e.step !== "symptom") };
  }
  return { entries: [...state.entries, { step, value }] };
}

/** User tapped an earlier answer: drop it and everything after, ask it again. */
export function editFrom(state: ChatState, step: StepId): ChatState {
  const i = state.entries.findIndex((e) => e.step === step);
  return i === -1 ? state : { entries: state.entries.slice(0, i) };
}

/** Text for the user's right-hand bubble. */
export function answerLabel(step: StepId, value: unknown): string {
  const input = STEPS[step].input;
  if (input.kind === "profile_form") return "กรอกข้อมูลแล้ว";
  if (input.kind === "symptom") {
    return symptomLabel((value as AnswerMap["symptom"]).code);
  }
  if (input.kind === "multi") {
    const labels = chosen(step, value).map((o) => o.label);
    return labels.length ? labels.join(" · ") : input.noneLabel;
  }
  return chosen(step, value)[0]?.label ?? String(value);
}

/** The conversation so far: question bubbles + the answer given. Also feeds R4. */
export function transcript(state: ChatState, ctx: FlowContext = {}) {
  const vars = promptVars(state, ctx);
  return state.entries.map((e) => ({
    step: e.step,
    bubbles: STEPS[e.step].prompt(vars),
    answer: answerLabel(e.step, e.value),
  }));
}

export function noteText(code: NoteCode): string {
  return NOTE_TEXT[code];
}

export function ageGroupFromBirthdate(birthdate: string, today: Date): AgeGroup {
  const [y, m, d] = birthdate.split("-").map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age < 12 ? "child" : age < 60 ? "adult" : "elderly";
}

/* ───────────────────────── internals ───────────────────────── */

/** Conditions that do NOT put a covid-positive user in the risk group.
    Everything else (incl. asthma — chronic lung disease) refers. Check against MOPH. */
const COVID_NOT_RISK: readonly Condition[] = ["allergy", "allergy_history"];

/** Rough position for the progress bar. */
const PROGRESS: Record<StepId, number> = {
  welcome: 0,
  consent: 0.05,
  profile_form: 0.08,
  returning: 0.08,
  who: 0.1,
  age: 0.15,
  sex: 0.2,
  pregnancy: 0.25,
  conditions: 0.3,
  meds: 0.4,
  symptom: 0.5,
  symptom_confirm: 0.55,
  numbness_onset: 0.6,
  danger: 0.6,
  duration: 0.7,
  resp_flags: 0.85,
  covid_atk: 0.8,
  muscle_flags: 0.8,
  muscle_route: 0.9,
  bloating_flags: 0.85,
  diarrhea_flags: 0.85,
  constipation_flags: 0.85,
  appetite_flags: 0.85,
  dizziness_flags: 0.85,
  insomnia_flags: 0.85,
  skin_type: 0.8,
  skin_flags: 0.9,
};

function answersOf(state: ChatState): Answers {
  const a: Record<string, unknown> = {};
  for (const e of state.entries) a[e.step] = e.value;
  return a as Answers;
}

function optionsOf(step: StepId): Option[] {
  const input = STEPS[step].input;
  return "options" in input ? input.options : [];
}

/** The options a stored value refers to (one for single, several for multi). */
function chosen(step: StepId, value: unknown): Option[] {
  const values = Array.isArray(value) ? value : [value];
  return optionsOf(step).filter((o) => values.includes(o.value));
}

/** RED FLAG beats REFER when one answer holds both. */
function stopFor(step: StepId, value: unknown): Outcome | undefined {
  const picked = chosen(step, value);
  const red = picked.filter((o) => o.effect?.kind === "redflag");
  if (red.length) return { kind: "redflag", signs: red.map((o) => o.label) };
  const ref = picked.find((o) => o.effect?.kind === "refer");
  if (ref?.effect?.kind === "refer") return { kind: "refer", reason: ref.effect.reason };
  return undefined;
}

function fromSaved(p: SavedProfile, today: Date): KnownProfile {
  return {
    ageGroup: ageGroupFromBirthdate(p.birthdate, today),
    sex: p.sex,
    conditions: p.conditions,
    meds: p.meds,
  };
}

function fromForm(f: ProfileForm, today: Date): KnownProfile {
  return { ageGroup: ageGroupFromBirthdate(f.birthdate, today), sex: f.sex };
}

function promptVars(state: ChatState, ctx: FlowContext): PromptVars {
  const a = answersOf(state);
  return {
    firstName: ctx.savedProfile?.firstName ?? a.profile_form?.firstName,
    symptomLabel: a.symptom ? symptomLabel(a.symptom.code) : undefined,
  };
}

function validate(step: StepId, value: unknown, today: Date): void {
  const input = STEPS[step].input;
  const bad = () => new Error(`Invalid answer for "${step}": ${JSON.stringify(value)}`);
  const allowed = optionsOf(step).map((o) => o.value);

  switch (input.kind) {
    case "single":
    case "consent":
      if (!allowed.includes(value as string | number)) throw bad();
      return;
    case "multi":
      if (
        !Array.isArray(value) ||
        new Set(value).size !== value.length ||
        !value.every((v) => allowed.includes(v))
      ) {
        throw bad();
      }
      return;
    case "symptom": {
      const v = value as Partial<AnswerMap["symptom"]> | null;
      if (
        !v ||
        !(SYMPTOM_CODES as readonly string[]).includes(v.code as string) ||
        !allowed.includes(v.code as string) ||
        (v.source !== "grid" && v.source !== "text")
      ) {
        throw bad();
      }
      return;
    }
    case "profile_form": {
      const v = value as Partial<ProfileForm> | null;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(v?.birthdate ?? "") ? new Date(v!.birthdate!) : null;
      if (
        !v ||
        (v.sex !== "male" && v.sex !== "female") ||
        !date ||
        Number.isNaN(date.getTime()) ||
        date > today ||
        date.getFullYear() < 1900
      ) {
        throw bad();
      }
      return;
    }
  }
}
