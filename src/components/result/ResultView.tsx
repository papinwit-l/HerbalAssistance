import { CircleSlash } from "lucide-react";
import symptomsData from "@/data/symptoms.json";
import { PersonaBubbles } from "@/components/chat/Bubbles";
import { noteText } from "@/lib/chat/flow";
import { symptomLabel } from "@/lib/chat/steps";
import type { Facts, NoteCode } from "@/lib/chat/types";
import { excludedSentence, recommend } from "@/lib/engine/recommend";
import HerbCard from "./HerbCard";

/* S11 — summary bubble, herb cards, "ไม่แนะนำ … เพราะ …" rows, notes,
   self-care tips and when to see a doctor (CHAT_SCRIPT.md S11). */
export default function ResultView({ facts, notes }: { facts: Facts; notes: NoteCode[] }) {
  const { recommended, excluded } = recommend(facts);
  const group = symptomsData.groups.find((g) => g.code === facts.symptom);
  const label = symptomLabel(facts.selectedSymptom);
  /* Small burn: the list has no self-care herb (aloe is radiation-only since 2568), so show first aid. */
  const firstAid = facts.skinType === "small_burn" ? symptomsData.first_aid.small_burn : undefined;

  const summary =
    firstAid && recommended.length === 0
      ? "แผลไฟไหม้ น้ำร้อนลวกขนาดเล็ก ไม่มียาสมุนไพรในบัญชีที่หนูแนะนำค่ะ ทำตามวิธีปฐมพยาบาลด้านล่างนะคะ"
      : recommended.length > 0
        ? `จากอาการ${label}ของคุณ หนูแนะนำสมุนไพร ${recommended.length} ชนิดค่ะ อ่านวิธีใช้และข้อควรระวังด้านล่างนะคะ`
        : excluded.length > 0
          ? `ตอนนี้ยังไม่มีสมุนไพรที่เหมาะกับคุณค่ะ เพราะ${[...new Set(excluded.flatMap((e) => e.reasons))].join(" และ")} แนะนำให้ปรึกษาเภสัชกรหรือแพทย์นะคะ`
          : `ตอนนี้หนูยังไม่มีข้อมูลสมุนไพรสำหรับอาการ${label}ค่ะ แนะนำให้ปรึกษาเภสัชกรหรือแพทย์นะคะ`;

  const maxDays = recommended.map((r) => r.herb.max_days).filter((d): d is number => d !== null);

  return (
    <div className="flex flex-col gap-4">
      <PersonaBubbles bubbles={[summary]} mood={recommended.length > 0 ? "turmeric" : "concerned"} />

      {firstAid && (
        <section className="flex flex-col gap-2 rounded-md bg-surface-raised p-4 shadow-card">
          <h2 className="text-title">{firstAid.title}</h2>
          <ol className="list-decimal pl-6 text-body">
            {firstAid.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <h3 className="text-heading text-refer-ink">ห้ามทำ</h3>
          <ul className="list-disc pl-6 text-body">
            {firstAid.dont.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <h3 className="text-heading text-refer-ink">ไปโรงพยาบาลถ้า…</h3>
          <ul className="list-disc pl-6 text-body">
            {firstAid.see_doctor_if.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {recommended.map((r) => (
        <HerbCard key={r.herb.id} item={r} />
      ))}

      {excluded.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-heading">ยาที่หนูไม่แนะนำสำหรับคุณ</h2>
          {excluded.map((e) => (
            <p
              key={e.herb.id}
              className="flex items-start gap-2 rounded-md bg-refer-50 px-4 py-3 text-body text-refer-ink"
            >
              <CircleSlash aria-hidden size={22} strokeWidth={2.5} className="mt-1 shrink-0" />
              <span>{excludedSentence(e)}</span>
            </p>
          ))}
        </section>
      )}

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-md bg-turmeric-100 p-4 text-body">
          {notes.map((n) => (
            <li key={n}>{noteText(n)}</li>
          ))}
        </ul>
      )}

      {group && group.self_care_tips.length > 0 && (
        <section className="flex flex-col gap-1 rounded-md bg-brand-100 p-4">
          <h2 className="text-heading">ดูแลตัวเองเบื้องต้น</h2>
          <ul className="list-disc pl-6 text-body">
            {group.self_care_tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-1 rounded-md border-2 border-refer-600 bg-surface-raised p-4">
        <h2 className="text-heading text-refer-ink">ควรไปพบแพทย์ถ้า…</h2>
        <ul className="list-disc pl-6 text-body">
          {(group?.see_doctor_if ?? []).map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>
            {maxDays.length > 0
              ? `ใช้ครบ ${Math.min(...maxDays)} วันแล้วไม่ดีขึ้น`
              : "ใช้ยาแล้วอาการไม่ดีขึ้น หรือแย่ลง"}
          </li>
        </ul>
      </section>

      {process.env.NODE_ENV !== "production" && (
        <details className="rounded-md border border-border bg-surface-raised p-3 text-caption">
          <summary className="cursor-pointer">dev: facts ที่ส่งให้ engine</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(facts, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
