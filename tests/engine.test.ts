import { describe, expect, it } from "vitest";
import symptomsData from "@/data/symptoms.json";
import { CONDITIONS, MEDS, type Facts } from "@/lib/chat/types";
import { ALL_HERBS, HERBS } from "@/lib/engine/herbs";
import { excludedSentence, recommend, UNASKED_LABEL } from "@/lib/engine/recommend";

/** Adult man, nothing special, 2–3 days. Override what each case needs. */
function facts(over: Partial<Facts> = {}): Facts {
  const symptom = over.symptom ?? "cough_sore_throat";
  return {
    forWhom: "self",
    ageGroup: "adult",
    sex: "male",
    pregnant: false,
    pregnancyUnsure: false,
    breastfeeding: false,
    conditions: [],
    meds: [],
    selectedSymptom: symptom,
    symptom,
    durationDays: 3,
    route: "both",
    ...over,
  };
}

const ids = (list: { herb: { id: string } }[]) => list.map((x) => x.herb.id);
const reasonsFor = (r: ReturnType<typeof recommend>, id: string) =>
  r.excluded.find((e) => e.herb.id === id)?.reasons;

describe("matching", () => {
  it("adult with sore throat gets the three cough herbs", () => {
    const r = recommend(facts());
    expect(ids(r.recommended)).toEqual(["fah-talai-jone", "prasa-mawaeng", "kae-ai-makham-pom"]);
    expect(r.excluded).toEqual([]);
  });

  it("route preference keeps only external or only oral herbs, silently", () => {
    const ext = recommend(facts({ symptom: "muscle_joint_pain", route: "external" }));
    expect(ids(ext.recommended)).toEqual(["plai-cream", "ya-prik", "ya-prakhop"]);
    const oral = recommend(facts({ symptom: "muscle_joint_pain", route: "oral" }));
    expect(ids(oral.recommended)).toEqual(["thaowan-priang", "sahatsathara"]);
    expect(oral.excluded).toEqual([]);
  });

  it("skin herbs need a matching skin_types entry (none yet) → nothing offered", () => {
    const r = recommend(facts({ symptom: "skin_wound", skinType: "scrape" }));
    expect(r.recommended).toEqual([]);
    expect(r.excluded).toEqual([]);
  });

  it("todo herbs (no data) never appear", () => {
    const r = recommend(facts({ symptom: "diarrhea" }));
    expect(ids(r.recommended)).toEqual(["fah-talai-jone"]);
  });

  it("covid positive has no herb bound yet → empty (UI says: ask a pharmacist)", () => {
    expect(recommend(facts({ symptom: "covid" })).recommended).toEqual([]);
  });
});

describe("safety filter — PROJECT_GUIDE §10 cases", () => {
  it("pregnant + constipation → both herbs excluded with the reason", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, symptom: "constipation_hemorrhoid" }));
    expect(r.recommended).toEqual([]);
    expect(reasonsFor(r, "makham-khaek")).toEqual(["ตั้งครรภ์"]);
    expect(reasonsFor(r, "phet-sangkhat")).toEqual(["ตั้งครรภ์"]);
  });

  it("pregnant + sore throat → ฟ้าทะลายโจร excluded, safer options still shown", () => {
    const r = recommend(facts({ sex: "female", pregnant: true }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["ตั้งครรภ์"]);
    expect(ids(r.recommended)).toEqual(["prasa-mawaeng", "kae-ai-makham-pom"]);
  });

  it("pregnancy ไม่แน่ใจ → excluded as อาจตั้งครรภ์", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, pregnancyUnsure: true }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["อาจตั้งครรภ์"]);
  });

  it("breastfeeding → ฟ้าทะลายโจร excluded", () => {
    const r = recommend(facts({ sex: "female", breastfeeding: true }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["ให้นมลูก"]);
  });

  it("elderly on anticoagulant + joint pain → ประคบ excluded for age", () => {
    const r = recommend(facts({ ageGroup: "elderly", meds: ["anticoagulant"], symptom: "muscle_joint_pain" }));
    expect(ids(r.recommended)).toEqual(["plai-cream", "thaowan-priang", "sahatsathara", "ya-prik"]);
    expect(reasonsFor(r, "ya-prakhop")).toEqual(["อายุ 60 ปีขึ้นไป"]);
  });

  it("elderly with high blood pressure on BP medicine + joint pain (the canvas example)", () => {
    const r = recommend(
      facts({ ageGroup: "elderly", conditions: ["hypertension"], meds: ["bp_meds"], symptom: "muscle_joint_pain" }),
    );
    expect(ids(r.recommended)).toEqual(["plai-cream", "thaowan-priang"]);
    expect(reasonsFor(r, "sahatsathara")).toEqual(["เป็นความดันสูง"]);
    expect(reasonsFor(r, "ya-prik")).toEqual(["กินยาความดัน"]);
    expect(reasonsFor(r, "ya-prakhop")).toEqual(["อายุ 60 ปีขึ้นไป"]);
  });

  it("kidney disease + bloating → ธาตุอบเชย excluded", () => {
    const r = recommend(facts({ conditions: ["kidney"], symptom: "bloating" }));
    expect(reasonsFor(r, "that-op-choei")).toEqual(["เป็นโรคไต"]);
    expect(ids(r.recommended)).toEqual(["khamin-chan", "khing-capsule", "hom-thep-pajit"]);
  });

  it("diabetes + cough → มะขามป้อม excluded", () => {
    const r = recommend(facts({ conditions: ["diabetes"] }));
    expect(reasonsFor(r, "kae-ai-makham-pom")).toEqual(["เป็นเบาหวาน"]);
  });

  it("heart disease also rules out herbs contraindicated in rheumatic heart disease", () => {
    const r = recommend(facts({ conditions: ["heart"] }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["เป็นโรคหัวใจ"]);
  });

  it("several reasons are all listed, in one sentence", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, meds: ["bp_meds"] }));
    const e = r.excluded.find((x) => x.herb.id === "fah-talai-jone")!;
    expect(e.reasons).toEqual(["ตั้งครรภ์", "กินยาความดัน"]);
    expect(excludedSentence(e)).toBe("ไม่แนะนำยาฟ้าทะลายโจร เพราะตั้งครรภ์ และกินยาความดันค่ะ");
  });

  it("unsure medicines play safe: herbs with any medicine warning are excluded", () => {
    const r = recommend(facts({ meds: ["unsure_meds"] }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["ไม่แน่ใจว่ากินยาอะไรอยู่"]);
    expect(ids(r.recommended)).toEqual(["prasa-mawaeng", "kae-ai-makham-pom"]);
  });

  it("other regular medicines exclude herbs that warn about them", () => {
    const r = recommend(facts({ meds: ["other_meds"], symptom: "muscle_joint_pain" }));
    expect(reasonsFor(r, "sahatsathara")).toEqual(["กินยาอื่นเป็นประจำ"]);
  });

  it("nobody is left → empty list, reasons kept for the message", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, symptom: "constipation_hemorrhoid" }));
    expect(r.recommended).toHaveLength(0);
    expect(r.excluded).toHaveLength(2);
  });
});

describe("card extras", () => {
  it("lists what the chat never asked as ห้ามใช้ถ้า…", () => {
    const r = recommend(facts({ symptom: "muscle_joint_pain" }));
    const sahat = r.recommended.find((x) => x.herb.id === "sahatsathara")!;
    expect(sahat.checkFirst).toEqual(["เป็นโรคกระเพาะ / แผลในกระเพาะอาหาร", "มีไข้"]);
  });

  it("flags a herb whose max_days the duration reaches", () => {
    const r = recommend(facts({ durationDays: 7 }));
    const fah = r.recommended.find((x) => x.herb.id === "fah-talai-jone")!;
    expect(fah.nearMaxDays).toBe(true);
    const short = recommend(facts({ durationDays: 3 })).recommended.find((x) => x.herb.id === "fah-talai-jone")!;
    expect(short.nearMaxDays).toBe(false);
  });
});

describe("herbs.json consistency", () => {
  const known = new Set(symptomsData.groups.map((g) => g.code));
  const askedConditions = new Set<string>(CONDITIONS);
  const askedMeds = new Set<string>(MEDS);

  it("parses (schema) and keeps todo entries out of the engine", () => {
    expect(ALL_HERBS.length).toBeGreaterThan(HERBS.length);
    expect(HERBS.every((h) => h.status !== ("todo" as string))).toBe(true);
  });

  it("ids are unique", () => {
    const all = ALL_HERBS.map((h) => h.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("every symptom code exists in symptoms.json", () => {
    for (const h of ALL_HERBS) for (const s of h.symptoms) expect(known, `${h.id}: ${s}`).toContain(s);
  });

  it("every condition / med / flag code is either asked in the chat or has a ห้ามใช้ถ้า label", () => {
    for (const h of HERBS) {
      for (const r of [h.exclude_if, h.caution_if]) {
        for (const c of r.conditions) {
          expect(askedConditions.has(c) || c in UNASKED_LABEL, `${h.id}: condition ${c}`).toBe(true);
        }
        for (const m of r.meds) expect(askedMeds.has(m), `${h.id}: med ${m}`).toBe(true);
        for (const f of r.flags) expect(f in UNASKED_LABEL, `${h.id}: flag ${f}`).toBe(true);
      }
    }
  });
});
