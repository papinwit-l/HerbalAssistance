import { describe, expect, it } from "vitest";
import symptomsData from "@/data/symptoms.json";
import {
  ageGroupFromBirthdate,
  answer,
  answerLabel,
  current,
  editFrom,
  resolve,
  start,
  transcript,
  type ChatState,
  type FlowContext,
} from "@/lib/chat/flow";
import { GROUP_STEPS } from "@/lib/chat/steps";
import { SYMPTOM_CODES, type AnswerMap, type StepId } from "@/lib/chat/types";

type Step = { [K in StepId]: [K, AnswerMap[K]] }[StepId];

const TODAY = new Date("2026-10-17T12:00:00");

/** Answer each step in order, asserting the chat asks exactly that step. */
function run(steps: Step[], ctx: FlowContext = {}): ChatState {
  const c = { today: TODAY, ...ctx };
  return steps.reduce<ChatState>((s, [step, value]) => answer(s, step, value as never, c), start());
}

const nextStep = (s: ChatState, ctx: FlowContext = {}) => {
  const r = resolve(s, { today: TODAY, ...ctx });
  return r.type === "ask" ? r.step : r.outcome.kind;
};

const outcome = (s: ChatState, ctx: FlowContext = {}) => {
  const r = resolve(s, { today: TODAY, ...ctx });
  if (r.type !== "outcome") throw new Error(`still asking ${r.step}`);
  return r.outcome;
};

/** Guest, adult man, no conditions, no meds. */
const GUEST_MAN: Step[] = [
  ["welcome", "guest"],
  ["who", "self"],
  ["age", "adult"],
  ["sex", "male"],
  ["conditions", []],
  ["meds", []],
];

const symptom = (code: AnswerMap["symptom"]["code"]): Step => ["symptom", { code, source: "grid" }];

describe("guest path", () => {
  it("asks S1–S10 in order and ends with a result", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("cough_sore_throat"),
      ["danger", []],
      ["duration", 3],
      ["resp_flags", []],
    ]);
    const o = outcome(s);
    expect(o.kind).toBe("result");
    if (o.kind !== "result") return;
    expect(o.facts).toMatchObject({
      forWhom: "self",
      ageGroup: "adult",
      sex: "male",
      pregnant: false,
      breastfeeding: false,
      conditions: [],
      meds: [],
      selectedSymptom: "cough_sore_throat",
      symptom: "cough_sore_throat",
      durationDays: 3,
      route: "both",
    });
    expect(o.notes).toEqual([]);
  });

  it("does not ask pregnancy for men or for women 60+", () => {
    expect(nextStep(run(GUEST_MAN.slice(0, 4)))).toBe("conditions");
    const elderlyWoman = run([
      ["welcome", "guest"],
      ["who", "self"],
      ["age", "elderly"],
      ["sex", "female"],
    ]);
    expect(nextStep(elderlyWoman)).toBe("conditions");
  });

  it("asks pregnancy for adult women; ไม่แน่ใจ counts as pregnant and adds a note", () => {
    const s = run([
      ["welcome", "guest"],
      ["who", "self"],
      ["age", "adult"],
      ["sex", "female"],
    ]);
    expect(nextStep(s)).toBe("pregnancy");
    const done = run([
      ["welcome", "guest"],
      ["who", "self"],
      ["age", "adult"],
      ["sex", "female"],
      ["pregnancy", "unsure"],
      ["conditions", []],
      ["meds", []],
      symptom("constipation_hemorrhoid"),
      ["danger", []],
      ["duration", 1],
      ["constipation_flags", []],
    ]);
    const o = outcome(done);
    expect(o.kind === "result" && o.facts.pregnant).toBe(true);
    expect(o.kind === "result" && o.notes).toContain("pregnancy_unsure");
  });

  it("breastfeeding is not pregnant", () => {
    const s = run([
      ["welcome", "guest"],
      ["who", "self"],
      ["age", "adult"],
      ["sex", "female"],
      ["pregnancy", "breastfeeding"],
      ["conditions", []],
      ["meds", []],
      symptom("bloating"),
      ["danger", []],
      ["duration", 1],
      ["bloating_flags", []],
    ]);
    const o = outcome(s);
    expect(o.kind === "result" && o.facts).toMatchObject({ pregnant: false, breastfeeding: true });
  });

  it("notes for allergy history and other/unsure medicines", () => {
    const s = run([
      ["welcome", "guest"],
      ["who", "other"],
      ["age", "elderly"],
      ["sex", "male"],
      ["conditions", ["allergy_history"]],
      ["meds", ["anticoagulant", "unsure_meds"]],
      symptom("muscle_joint_pain"),
      ["danger", []],
      ["duration", 7],
      ["muscle_flags", []],
      ["muscle_route", "external"],
    ]);
    const o = outcome(s);
    expect(o.kind).toBe("result");
    if (o.kind !== "result") return;
    expect(o.notes).toEqual(["allergy_history", "show_meds"]);
    expect(o.facts).toMatchObject({ forWhom: "other", route: "external", meds: ["anticoagulant", "unsure_meds"] });
  });
});

describe("stops", () => {
  it("child → OUT right after age", () => {
    const s = run([
      ["welcome", "guest"],
      ["who", "other"],
      ["age", "child"],
    ]);
    expect(outcome(s)).toEqual({ kind: "out", reason: "child" });
  });

  it("any danger sign → RED FLAG with the signs listed", () => {
    const s = run([...GUEST_MAN, symptom("cold_flu"), ["danger", ["breathing", "chest_pain"]]]);
    expect(outcome(s)).toEqual({
      kind: "redflag",
      signs: ["หายใจลำบาก หอบเหนื่อย", "เจ็บแน่นหน้าอก"],
    });
  });

  it("more than a week → REFER", () => {
    const s = run([...GUEST_MAN, symptom("bloating"), ["danger", []], ["duration", 8]]);
    expect(outcome(s).kind).toBe("refer");
  });

  it("a group flag → REFER with that flag as the reason", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("cough_sore_throat"),
      ["danger", []],
      ["duration", 1],
      ["resp_flags", ["cough_blood"]],
    ]);
    expect(outcome(s)).toEqual({ kind: "refer", reason: "ไอเป็นเลือด" });
  });

  it("sore throat with pus, high fever, chills → REFER (ฟ้าทะลายโจร contraindication)", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("cough_sore_throat"),
      ["danger", []],
      ["duration", 1],
      ["resp_flags", ["throat_pus"]],
    ]);
    expect(outcome(s)).toEqual({ kind: "refer", reason: "มีตุ่มหนองในคอ ไข้สูง หนาวสั่น" });
  });

  it("dizziness: sudden headache → RED FLAG, beats fainting → REFER", () => {
    const base: Step[] = [...GUEST_MAN, symptom("dizziness"), ["danger", []], ["duration", 1]];
    expect(outcome(run([...base, ["dizziness_flags", ["fainting"]]])).kind).toBe("refer");
    expect(outcome(run([...base, ["dizziness_flags", ["fainting", "sudden_headache"]]]))).toEqual({
      kind: "redflag",
      signs: ["ปวดหัวรุนแรงทันที"],
    });
  });

  it("numbness: sudden → RED FLAG; long-standing → danger check, then REFER", () => {
    const base: Step[] = [...GUEST_MAN, symptom("numbness_paralysis")];
    expect(nextStep(run(base))).toBe("numbness_onset");
    expect(outcome(run([...base, ["numbness_onset", "sudden"]])).kind).toBe("redflag");

    const long = run([...base, ["numbness_onset", "long"]]);
    expect(nextStep(long)).toBe("danger");
    expect(outcome(run([...base, ["numbness_onset", "long"], ["danger", []]])).kind).toBe("refer");
    expect(outcome(run([...base, ["numbness_onset", "long"], ["danger", ["stroke_signs"]]])).kind).toBe(
      "redflag",
    );
  });

  it("skin: animal bite → REFER", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("skin_wound"),
      ["danger", []],
      ["duration", 1],
      ["skin_type", "scrape"],
      ["skin_flags", ["animal_bite"]],
    ]);
    expect(outcome(s)).toEqual({ kind: "refer", reason: "ถูกสัตว์กัด" });
  });
});

describe("group-specific rules", () => {
  const covid = (atk: AnswerMap["covid_atk"], age: "adult" | "elderly", conditions: AnswerMap["conditions"]) =>
    run([
      ["welcome", "guest"],
      ["who", "self"],
      ["age", age],
      ["sex", "male"],
      ["conditions", conditions],
      ["meds", []],
      symptom("covid"),
      ["danger", []],
      ["duration", 3],
      ["covid_atk", atk],
    ]);

  it("covid positive + risk group (60+ or a chronic condition) → REFER", () => {
    expect(outcome(covid("positive", "elderly", [])).kind).toBe("refer");
    expect(outcome(covid("positive", "adult", ["diabetes"])).kind).toBe("refer");
  });

  it("covid positive + asthma (chronic lung disease) → REFER; ภูมิแพ้ alone is not a risk group", () => {
    expect(outcome(covid("positive", "adult", ["asthma"])).kind).toBe("refer");
    expect(nextStep(covid("positive", "adult", ["allergy"]))).toBe("resp_flags");
  });

  it("covid positive, not risk group (allergy history alone doesn't count) → keeps going as covid", () => {
    const s = covid("positive", "adult", ["allergy_history"]);
    expect(nextStep(s)).toBe("resp_flags");
    const o = outcome(answer(s, "resp_flags", [], { today: TODAY }));
    expect(o.kind === "result" && o.facts).toMatchObject({ symptom: "covid", covidAtk: "positive" });
  });

  it("covid negative → matched as cold_flu; not tested → cold_flu + ATK note", () => {
    const neg = outcome(answer(covid("negative", "adult", []), "resp_flags", [], { today: TODAY }));
    expect(neg.kind === "result" && neg.facts).toMatchObject({ selectedSymptom: "covid", symptom: "cold_flu" });

    const none = outcome(answer(covid("not_tested", "elderly", []), "resp_flags", [], { today: TODAY }));
    expect(none.kind === "result" && none.facts.symptom).toBe("cold_flu");
    expect(none.kind === "result" && none.notes).toContain("atk_advice");
  });

  it("diarrhea always adds the ORS note", () => {
    const s = run([...GUEST_MAN, symptom("diarrhea"), ["danger", []], ["duration", 1], ["diarrhea_flags", []]]);
    const o = outcome(s);
    expect(o.kind === "result" && o.notes).toEqual(["ors"]);
  });

  it("insomnia stress is a gentle refer: still a result, with the 1323 note", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("insomnia"),
      ["danger", []],
      ["duration", 7],
      ["insomnia_flags", ["stress"]],
    ]);
    const o = outcome(s);
    expect(o.kind).toBe("result");
    expect(o.kind === "result" && o.notes).toEqual(["mental_health"]);
  });

  it("skin type reaches the facts", () => {
    const s = run([
      ...GUEST_MAN,
      symptom("skin_wound"),
      ["danger", []],
      ["duration", 1],
      ["skin_type", "small_burn"],
      ["skin_flags", []],
    ]);
    const o = outcome(s);
    expect(o.kind === "result" && o.facts.skinType).toBe("small_burn");
  });
});

describe("free-text symptom", () => {
  it("asks to confirm; เลือกเอง goes back to the grid", () => {
    const s = run([...GUEST_MAN, ["symptom", { code: "dizziness", source: "text" }]]);
    const view = current(s, { today: TODAY });
    expect(view.type === "ask" && view.step).toBe("symptom_confirm");
    expect(view.type === "ask" && view.bubbles[0]).toBe("หมายถึง วิงเวียน ใช่ไหมคะ?");

    const picked = answer(s, "symptom_confirm", "pick", { today: TODAY });
    expect(nextStep(picked)).toBe("symptom");

    const yes = answer(s, "symptom_confirm", "yes", { today: TODAY });
    expect(nextStep(yes)).toBe("danger");
  });
});

describe("logged-in paths", () => {
  const saved = {
    firstName: "สมศรี",
    birthdate: "1960-05-01", // 66 → elderly
    sex: "female" as const,
    conditions: ["hypertension" as const],
    meds: ["bp_meds" as const],
  };

  it("returning [เหมือนเดิม] + ตัวเอง skips S2–S6", () => {
    const ctx = { savedProfile: saved };
    const s = run(
      [
        ["welcome", "line"],
        ["returning", "same"],
        ["who", "self"],
      ],
      ctx,
    );
    expect(nextStep(s, ctx)).toBe("symptom");
    const done = run(
      [
        ["welcome", "line"],
        ["returning", "same"],
        ["who", "self"],
        symptom("muscle_joint_pain"),
        ["danger", []],
        ["duration", 3],
        ["muscle_flags", []],
        ["muscle_route", "both"],
      ],
      ctx,
    );
    const o = outcome(done, ctx);
    expect(o.kind === "result" && o.facts).toMatchObject({
      ageGroup: "elderly",
      sex: "female",
      conditions: ["hypertension"],
      meds: ["bp_meds"],
    });
  });

  it("returning greets by first name", () => {
    const view = current(run([["welcome", "line"]], { savedProfile: saved }), {
      savedProfile: saved,
      today: TODAY,
    });
    expect(view.type === "ask" && view.bubbles[0]).toBe("สวัสดีค่ะคุณสมศรี");
  });

  it("returning [เหมือนเดิม] still asks pregnancy for an adult woman", () => {
    const ctx = { savedProfile: { ...saved, birthdate: "1995-01-01" } };
    const s = run(
      [
        ["welcome", "line"],
        ["returning", "same"],
        ["who", "self"],
      ],
      ctx,
    );
    expect(nextStep(s, ctx)).toBe("pregnancy");
    expect(nextStep(answer(s, "pregnancy", "no", { ...ctx, today: TODAY }), ctx)).toBe("symptom");
  });

  it("returning but asking for someone else → asks everything", () => {
    const ctx = { savedProfile: saved };
    const s = run(
      [
        ["welcome", "line"],
        ["returning", "same"],
        ["who", "other"],
      ],
      ctx,
    );
    expect(nextStep(s, ctx)).toBe("age");
  });

  it("returning [แก้ไข] skips who, keeps age/sex from the profile, re-asks conditions and meds", () => {
    const ctx = { savedProfile: saved };
    const s = run(
      [
        ["welcome", "line"],
        ["returning", "edit"],
      ],
      ctx,
    );
    expect(nextStep(s, ctx)).toBe("conditions");
  });

  it("first login: consent → profile form; age and sex come from the form", () => {
    const s = run([
      ["welcome", "line"],
      ["consent", "agree"],
      ["profile_form", { firstName: "สมชาย", birthdate: "1990-03-15", sex: "male" }],
      ["who", "self"],
    ]);
    expect(nextStep(s)).toBe("conditions");
  });

  it("first login, declining consent → same as guest", () => {
    const s = run([
      ["welcome", "line"],
      ["consent", "decline"],
      ["who", "self"],
    ]);
    expect(nextStep(s)).toBe("age");
  });
});

describe("editing and validation", () => {
  it("editFrom drops that answer and everything after", () => {
    const s = run([...GUEST_MAN, symptom("bloating"), ["danger", []]]);
    const edited = editFrom(s, "sex");
    expect(edited.entries.map((e) => e.step)).toEqual(["welcome", "who", "age"]);
    expect(nextStep(edited)).toBe("sex");
  });

  it("refuses an answer to a question that isn't being asked", () => {
    expect(() => answer(start(), "age", "adult")).toThrow();
  });

  it("refuses invalid values", () => {
    const s = run([["welcome", "guest"], ["who", "self"]]);
    expect(() => answer(s, "age", "teen" as never, { today: TODAY })).toThrow();
    const m = run(GUEST_MAN.slice(0, 4));
    expect(() => answer(m, "conditions", ["cancer"] as never, { today: TODAY })).toThrow();
    expect(() => answer(m, "conditions", ["diabetes", "diabetes"], { today: TODAY })).toThrow();
  });

  it("refuses a future or malformed birthdate", () => {
    const s = run([
      ["welcome", "line"],
      ["consent", "agree"],
    ]);
    expect(() =>
      answer(s, "profile_form", { birthdate: "2569-01-01", sex: "male" }, { today: TODAY }),
    ).toThrow(); // Buddhist-era year typed by mistake
    expect(() => answer(s, "profile_form", { birthdate: "1-1-1990", sex: "male" }, { today: TODAY })).toThrow();
  });

  it("labels answers for the chat bubbles", () => {
    expect(answerLabel("conditions", [])).toBe("ไม่มี");
    expect(answerLabel("conditions", ["hypertension", "kidney"])).toBe("ความดันสูง · โรคไต");
    expect(answerLabel("duration", 8)).toBe("มากกว่า 1 สัปดาห์");
    expect(answerLabel("symptom", { code: "insomnia", source: "grid" })).toBe("นอนไม่หลับ");
    const t = transcript(run(GUEST_MAN.slice(0, 2)));
    expect(t.map((x) => x.answer)).toEqual(["ลองใช้โดยไม่บันทึกข้อมูล", "ตัวเอง"]);
  });

  it("computes age groups from a birthdate", () => {
    expect(ageGroupFromBirthdate("2014-10-18", TODAY)).toBe("child"); // turns 12 tomorrow
    expect(ageGroupFromBirthdate("2014-10-17", TODAY)).toBe("adult");
    expect(ageGroupFromBirthdate("1966-10-17", TODAY)).toBe("elderly");
  });
});

describe("data consistency", () => {
  it("every enabled group in symptoms.json is a known code with S10 questions defined", () => {
    const enabled = symptomsData.groups.filter((g) => g.enabled).map((g) => g.code);
    for (const code of enabled) {
      expect(SYMPTOM_CODES as readonly string[]).toContain(code);
      expect(GROUP_STEPS).toHaveProperty(code);
    }
    expect(enabled.sort()).toEqual([...SYMPTOM_CODES].sort());
  });

  it("every enabled group can reach a result or a stop", () => {
    for (const code of SYMPTOM_CODES) {
      let s = run([...GUEST_MAN, symptom(code)]);
      for (let i = 0; i < 10; i++) {
        const v = current(s, { today: TODAY });
        if (v.type === "outcome") break;
        const input = v.input;
        const value =
          input.kind === "multi" ? [] : "options" in input ? input.options[input.options.length - 1].value : null;
        s = answer(s, v.step, value as never, { today: TODAY });
      }
      expect(current(s, { today: TODAY }).type).toBe("outcome");
    }
  });
});
