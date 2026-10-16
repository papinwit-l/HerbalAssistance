import { Clock, Moon, Utensils, type LucideIcon } from "lucide-react";
import type { Herb } from "@/lib/engine/herbs";
import type { Recommended } from "@/lib/engine/recommend";

const TIMING: Record<Herb["timing"], { label: string; Icon: LucideIcon }> = {
  before_meal: { label: "ก่อนอาหาร", Icon: Utensils },
  after_meal: { label: "หลังอาหาร", Icon: Utensils },
  bedtime: { label: "ก่อนนอน", Icon: Moon },
  as_needed: { label: "เมื่อมีอาการ", Icon: Clock },
};

/* Every fact on this card comes straight from herbs.json — never from AI text. */
export default function HerbCard({ item }: { item: Recommended }) {
  const { herb, checkFirst, nearMaxDays } = item;
  const timing = TIMING[herb.timing];
  const oral = herb.route === "oral";

  return (
    <article className="flex flex-col gap-3 rounded-md bg-surface-raised p-4 shadow-card">
      {/* Photo goes here once /public/herbs has images. */}
      <header className="flex flex-col gap-1">
        <h2 className="text-title">{herb.name_th}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {herb.form && <span className="text-body text-ink-muted">{herb.form}</span>}
          <span
            className={`rounded-sm px-2 text-caption font-semibold ${
              oral ? "bg-brand-700 text-on-brand" : "bg-brand-100 text-brand-800"
            }`}
          >
            {oral ? "ยากิน" : "ยาใช้ภายนอก"}
          </span>
        </div>
      </header>

      {/* Dose strip */}
      <div className="flex flex-col gap-1 rounded-md bg-turmeric-100 px-4 py-3">
        <h3 className="text-heading">ขนาดและวิธีใช้</h3>
        <p className="text-body">{herb.dose}</p>
        {herb.how_to_take && (
          <p className="flex items-center gap-2 text-body font-semibold">
            <timing.Icon aria-hidden size={22} strokeWidth={2.5} className="shrink-0 text-turmeric-500" />
            <span>{herb.how_to_take === "ตามฉลาก" ? `${timing.label} · ทำตามฉลาก` : herb.how_to_take}</span>
          </p>
        )}
        {herb.max_days !== null && <p className="text-body font-semibold">ใช้ไม่เกิน {herb.max_days} วัน</p>}
      </div>

      {checkFirst.length > 0 && (
        <section className="flex flex-col gap-1 rounded-md border-2 border-refer-600 px-4 py-3">
          <h3 className="text-heading text-refer-ink">ห้ามใช้ถ้า…</h3>
          <ul className="list-disc pl-6 text-body">
            {checkFirst.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      {herb.cautions.length > 0 && (
        <Section title="ข้อควรระวัง" items={herb.cautions} />
      )}
      {herb.side_effects.length > 0 && (
        <Section title="ผลข้างเคียงที่อาจเกิด" items={herb.side_effects} />
      )}

      {(nearMaxDays || herb.see_doctor_if.length > 0) && (
        <Section
          title="ควรไปพบแพทย์ถ้า…"
          items={[
            ...herb.see_doctor_if,
            ...(nearMaxDays && herb.max_days
              ? [`ใช้ครบ ${herb.max_days} วันแล้วไม่ดีขึ้น (คุณเป็นมาใกล้ครบแล้ว)`]
              : []),
          ]}
        />
      )}

      {herb.buying_tip && (
        <div className="flex flex-col gap-1">
          <h3 className="text-heading">วิธีเลือกซื้อ</h3>
          <p className="text-body">{herb.buying_tip}</p>
        </div>
      )}

      <footer className="flex flex-col gap-1 text-caption text-ink-muted">
        <p>ที่มา: {herb.sources.map((s) => s.name).join(" · ")}</p>
        {herb.status === "draft" && <p>ข้อมูลร่าง — ยังไม่ได้ตรวจกับบัญชียาหลักแห่งชาติด้านสมุนไพร</p>}
      </footer>
    </article>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-heading">{title}</h3>
      <ul className="list-disc pl-6 text-body">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
