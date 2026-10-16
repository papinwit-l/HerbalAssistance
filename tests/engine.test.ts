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
const card = (r: ReturnType<typeof recommend>, id: string) => r.recommended.find((x) => x.herb.id === id)!;

describe("matching", () => {
  it("adult with sore throat gets the three cough herbs", () => {
    const r = recommend(facts());
    expect(ids(r.recommended)).toEqual(["fah-talai-jone", "prasa-mawaeng", "kae-ai-makham-pom"]);
    expect(r.excluded).toEqual([]);
  });

  it("cold gets ฟ้าทะลายโจร and ปราบชมพูทวีป (2568)", () => {
    expect(ids(recommend(facts({ symptom: "cold_flu" })).recommended)).toEqual([
      "fah-talai-jone",
      "prap-chomphu-thawip",
    ]);
  });

  it("route preference keeps only external or only oral herbs, silently", () => {
    const ext = recommend(facts({ symptom: "muscle_joint_pain", route: "external" }));
    expect(ids(ext.recommended)).toEqual(["plai-cream", "ya-prik", "ya-prakhop"]);
    const oral = recommend(facts({ symptom: "muscle_joint_pain", route: "oral" }));
    expect(ids(oral.recommended)).toEqual(["thaowan-priang"]);
    expect(oral.excluded).toEqual([]);
  });

  it("skin herbs follow the chosen skin type", () => {
    expect(ids(recommend(facts({ symptom: "skin_wound", skinType: "scrape" })).recommended)).toEqual([
      "mangosteen-peel",
    ]);
    expect(ids(recommend(facts({ symptom: "skin_wound", skinType: "itch_bite" })).recommended)).toEqual([
      "phaya-yo-lotion",
    ]);
  });

  it("small burn: no herb in the list (aloe is radiation-only since 2568) → first aid instead", () => {
    const r = recommend(facts({ symptom: "skin_wound", skinType: "small_burn" }));
    expect(r.recommended).toEqual([]);
    expect(r.excluded).toEqual([]);
    expect(symptomsData.first_aid.small_burn.steps.length).toBeGreaterThan(0);
  });

  it("diarrhea gets the three non-infectious diarrhea herbs", () => {
    expect(ids(recommend(facts({ symptom: "diarrhea" })).recommended)).toEqual([
      "fah-talai-jone-diarrhea",
      "lueang-pit-samut",
      "ya-kluai",
    ]);
  });

  it("covid positive (mild) gets the covid ฟ้าทะลายโจร entry", () => {
    expect(ids(recommend(facts({ symptom: "covid" })).recommended)).toEqual(["fah-talai-jone-covid"]);
  });

  it("insomnia only has the hospital-made ยาหอมแก้ลมวิงเวียน", () => {
    const r = recommend(facts({ symptom: "insomnia" }));
    expect(ids(r.recommended)).toEqual(["hom-kae-lom-wingwian"]);
    expect(r.recommended[0].herb.availability).toBe("hospital");
  });

  it("removed herbs are gone for good", () => {
    const all = ALL_HERBS.map((h) => h.id);
    for (const id of ["sahatsathara", "prasa-plai", "aloe-vera", "khing-tea", "khing-capsule"]) {
      expect(all).not.toContain(id);
    }
  });
});

describe("safety filter — PROJECT_GUIDE §10 cases", () => {
  it("pregnant + constipation → มะขามแขก and เพชรสังฆาต excluded; ตรีผลา has no pregnancy rule", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, symptom: "constipation_hemorrhoid" }));
    expect(reasonsFor(r, "makham-khaek")).toEqual(["ตั้งครรภ์"]);
    expect(reasonsFor(r, "phet-sangkhat")).toEqual(["ตั้งครรภ์"]);
    expect(ids(r.recommended)).toEqual(["triphala"]);
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

  it("pregnant + dizziness → หอมเทพจิตร excluded by app policy (not in the list)", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, symptom: "dizziness" }));
    expect(reasonsFor(r, "hom-thep-pajit")).toEqual(["ตั้งครรภ์"]);
    expect(HERBS.find((h) => h.id === "hom-thep-pajit")!.app_policy?.length).toBeGreaterThan(0);
  });

  it("breastfeeding → ฟ้าทะลายโจร excluded", () => {
    const r = recommend(facts({ sex: "female", breastfeeding: true }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["ให้นมลูก"]);
  });

  it("elderly on anticoagulant + joint pain → ยาพริก (medicine) and ประคบ (age) excluded", () => {
    const r = recommend(facts({ ageGroup: "elderly", meds: ["anticoagulant"], symptom: "muscle_joint_pain" }));
    expect(ids(r.recommended)).toEqual(["plai-cream", "thaowan-priang"]);
    expect(reasonsFor(r, "ya-prik")).toEqual(["กินยาละลายลิ่มเลือด"]);
    expect(reasonsFor(r, "ya-prakhop")).toEqual(["อายุ 60 ปีขึ้นไป"]);
  });

  it("elderly with high blood pressure on BP medicine + joint pain (the canvas example)", () => {
    const r = recommend(
      facts({ ageGroup: "elderly", conditions: ["hypertension"], meds: ["bp_meds"], symptom: "muscle_joint_pain" }),
    );
    expect(ids(r.recommended)).toEqual(["plai-cream", "thaowan-priang"]);
    expect(reasonsFor(r, "ya-prik")).toEqual(["กินยาความดัน"]);
    expect(reasonsFor(r, "ya-prakhop")).toEqual(["อายุ 60 ปีขึ้นไป"]);
  });

  it("kidney disease + bloating → ธาตุอบเชย excluded", () => {
    const r = recommend(facts({ conditions: ["kidney"], symptom: "bloating" }));
    expect(reasonsFor(r, "that-op-choei")).toEqual(["เป็นโรคไต"]);
    expect(ids(r.recommended)).toEqual(["khamin-chan", "khing"]);
  });

  it("gallstones + bloating → ขมิ้นชัน and ขิง excluded", () => {
    const r = recommend(facts({ conditions: ["gallstones"], symptom: "bloating" }));
    expect(reasonsFor(r, "khamin-chan")).toEqual(["เป็นนิ่วในถุงน้ำดี"]);
    expect(reasonsFor(r, "khing")).toEqual(["เป็นนิ่วในถุงน้ำดี"]);
    expect(ids(r.recommended)).toEqual(["that-op-choei"]);
  });

  it("liver disease + sore throat → ฟ้าทะลายโจร excluded (2568 caution)", () => {
    expect(reasonsFor(recommend(facts({ conditions: ["liver"] })), "fah-talai-jone")).toEqual(["เป็นโรคตับ"]);
  });

  it("diabetes + cough → มะขามป้อม excluded", () => {
    const r = recommend(facts({ conditions: ["diabetes"] }));
    expect(reasonsFor(r, "kae-ai-makham-pom")).toEqual(["เป็นเบาหวาน"]);
  });

  it("heart disease also rules out herbs contraindicated in rheumatic heart disease", () => {
    const r = recommend(facts({ conditions: ["heart"] }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["เป็นโรคหัวใจ"]);
  });

  it("ภูมิแพ้ counts as pollen allergy: every ยาหอม is excluded", () => {
    const r = recommend(facts({ conditions: ["allergy"], symptom: "dizziness" }));
    expect(r.recommended).toEqual([]);
    expect(reasonsFor(r, "hom-thep-pajit")).toEqual(["เป็นภูมิแพ้"]);
    expect(reasonsFor(r, "hom-nawakot")).toEqual(["เป็นภูมิแพ้"]);
    expect(reasonsFor(r, "hom-kae-lom-wingwian")).toEqual(["เป็นภูมิแพ้"]);
  });

  it("asthma rules out ยาพริก (app policy: theophylline) and nothing for cough", () => {
    const r = recommend(facts({ conditions: ["asthma"], symptom: "muscle_joint_pain" }));
    expect(reasonsFor(r, "ya-prik")).toEqual(["เป็นหอบหืด"]);
    expect(recommend(facts({ conditions: ["asthma"] }))).toEqual(recommend(facts()));
  });

  it("several reasons are all listed, in one sentence", () => {
    const r = recommend(facts({ sex: "female", pregnant: true, meds: ["bp_meds"] }));
    const e = r.excluded.find((x) => x.herb.id === "fah-talai-jone")!;
    expect(e.reasons).toEqual(["ตั้งครรภ์", "กินยาความดัน"]);
    expect(excludedSentence(e)).toBe("ไม่แนะนำยาฟ้าทะลายโจร (ชนิดผง) เพราะตั้งครรภ์ และกินยาความดันค่ะ");
  });

  it("unsure medicines play safe: herbs with any medicine warning are excluded", () => {
    const r = recommend(facts({ meds: ["unsure_meds"] }));
    expect(reasonsFor(r, "fah-talai-jone")).toEqual(["ไม่แน่ใจว่ากินยาอะไรอยู่"]);
    expect(ids(r.recommended)).toEqual(["prasa-mawaeng", "kae-ai-makham-pom"]);
  });

  it("other regular medicines exclude herbs that warn about them", () => {
    const r = recommend(facts({ meds: ["other_meds"], symptom: "muscle_joint_pain" }));
    expect(reasonsFor(r, "ya-prik")).toEqual(["กินยาอื่นเป็นประจำ"]);
  });

  it("diabetes medicine rules out มะระขี้นก", () => {
    const r = recommend(facts({ meds: ["diabetes_meds"], symptom: "poor_appetite" }));
    expect(reasonsFor(r, "mara-khinok")).toEqual(["กินยาเบาหวาน"]);
  });

  it("nobody is left → empty list, reasons kept for the message", () => {
    const r = recommend(facts({ sex: "female", breastfeeding: true, symptom: "poor_appetite" }));
    expect(r.recommended).toHaveLength(0);
    expect(reasonsFor(r, "mara-khinok")).toEqual(["ให้นมลูก"]);
  });
});

describe("card extras", () => {
  it("lists what the chat never asked as ห้ามใช้ถ้า…, but not what it asks", () => {
    const fah = card(recommend(facts()), "fah-talai-jone");
    expect(fah.checkFirst).toEqual([
      "เคยเป็นโรคหัวใจรูมาติก",
      "เคยเป็นไตอักเสบหลังติดเชื้อสเตรปโตคอคคัส",
      "เจ็บคอจากเชื้อสเตรปโตคอคคัส (แพทย์บอก)",
    ]);
    expect(card(recommend(facts({ symptom: "dizziness" })), "hom-nawakot").checkFirst).toEqual(["มีไข้"]);
  });

  it("a long illness does not rule a herb out; it stresses seeing a doctor", () => {
    const r = recommend(facts({ durationDays: 7 }));
    expect(card(r, "fah-talai-jone").nearMaxDays).toBe(true);
    expect(r.excluded).toEqual([]);
    expect(card(recommend(facts({ durationDays: 1 })), "fah-talai-jone").nearMaxDays).toBe(false);
  });
});

describe("herbs.json consistency", () => {
  const known = new Set(symptomsData.groups.map((g) => g.code));
  const askedConditions = new Set<string>(CONDITIONS);
  const askedMeds = new Set<string>(MEDS);

  it("parses (schema) and the engine never sees todo entries", () => {
    expect(ALL_HERBS.length).toBeGreaterThanOrEqual(HERBS.length);
    expect(HERBS.every((h) => h.status !== ("todo" as string))).toBe(true);
  });

  it("ids are unique", () => {
    const all = ALL_HERBS.map((h) => h.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("every symptom code exists in symptoms.json", () => {
    for (const h of ALL_HERBS) for (const s of h.symptoms) expect(known, `${h.id}: ${s}`).toContain(s);
  });

  it("every entry cites a page of the national list", () => {
    for (const h of HERBS) {
      expect(h.sources.length, h.id).toBeGreaterThan(0);
      for (const s of h.sources) expect(s.page, `${h.id}: ${s.name}`).toBeTruthy();
    }
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
