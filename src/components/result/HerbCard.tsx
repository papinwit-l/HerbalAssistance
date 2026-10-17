import MaskIcon from "@/components/ui/MaskIcon";
import DoseCounter from "./DoseCounter";
import type { Herb } from "@/lib/engine/herbs";
import type { Recommended } from "@/lib/engine/recommend";

const TIMING: Record<Herb["timing"], { label: string; icon: string }> = {
  before_meal: { label: "ก่อนอาหาร", icon: "/icons/ui/timing-before-meal.svg" },
  after_meal: { label: "หลังอาหาร", icon: "/icons/ui/timing-after-meal.svg" },
  bedtime: { label: "ก่อนนอน", icon: "/icons/ui/timing-bedtime.svg" },
  as_needed: { label: "เมื่อมีอาการ", icon: "/icons/ui/timing-as-needed.svg" },
  as_label: { label: "ตามฉลาก", icon: "/icons/ui/timing-as-needed.svg" },
};

/* Every fact on this card comes straight from herbs.json — never from AI text. */
export default function HerbCard({ item }: { item: Recommended }) {
  const { herb, checkFirst, nearMaxDays } = item;
  const timing = TIMING[herb.timing];
  const oral = herb.route === "oral";
  const shop = herb.availability === "shop";
  const seeDoctor = [
    ...(herb.see_doctor_if.length > 0
      ? herb.see_doctor_if
      : herb.max_days !== null
        ? [`ใช้ครบ ${herb.max_days} วันแล้วไม่ดีขึ้น`]
        : []),
    ...(nearMaxDays ? ["คุณเป็นมาหลายวันแล้ว ถ้าใช้ยาแล้วยังไม่ดีขึ้น ควรไปพบแพทย์เลย"] : []),
  ];

  return (
    <article className="flex flex-col gap-3 rounded-md bg-surface-raised p-4 shadow-card">
      {/* Photo goes here once /public/herbs has images. */}
      <header className="flex flex-col gap-1">
        <h2 className="text-title">{herb.name_th}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {herb.form && <span className="text-body text-ink-muted">{herb.form}</span>}
          <span
            className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-caption font-semibold ${
              oral ? "bg-brand-700 text-on-brand" : "bg-brand-100 text-brand-800"
            }`}
          >
            <MaskIcon src={oral ? "/icons/ui/route-oral.svg" : "/icons/ui/route-external.svg"} className="size-5" />
            {oral ? "ยากิน" : "ยาใช้ภายนอก"}
          </span>
          {!shop && (
            <span className="rounded-sm bg-turmeric-100 px-2 py-0.5 text-caption font-semibold">
              มีที่ รพ.สต. / โรงพยาบาล
            </span>
          )}
        </div>
        <p className="text-body">{herb.indication}</p>
      </header>

      {/* Dose strip */}
      <div className="flex flex-col gap-1 rounded-md bg-turmeric-100 px-4 py-3">
        <h3 className="text-heading">ขนาดและวิธีใช้</h3>
        {shop ? (
          <>
            <p className="text-body font-semibold">ทำตามขนาดบนฉลากยา</p>
            <p className="text-body">ขนาดตามบัญชียาหลักฯ: {herb.dose}</p>
          </>
        ) : (
          <p className="text-body">{herb.dose}</p>
        )}
        {herb.dose_easy?.map((t) => (
          <p key={t} className="text-body-lg font-semibold">
            {t}
          </p>
        ))}
        {herb.dose_mg && <DoseCounter dose={herb.dose_mg} />}
        {herb.how_to_take && herb.timing !== "as_label" && (
          <p className="flex items-center gap-2 text-body font-semibold">
            <MaskIcon src={timing.icon} className="size-8 text-brand-700" />
            <span>{herb.how_to_take}</span>
          </p>
        )}
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

      {seeDoctor.length > 0 && <Section title="ควรไปพบแพทย์ถ้า…" items={seeDoctor} />}

      {herb.buying_tip && (
        <div className="flex flex-col gap-1">
          <h3 className="text-heading">{shop ? "วิธีเลือกซื้อ" : "ขอรับยาได้ที่ไหน"}</h3>
          <p className="text-body">{herb.buying_tip}</p>
        </div>
      )}

      <footer className="flex flex-col gap-1 text-caption text-ink-muted">
        <p>ที่มา: {herb.sources.map((s) => (s.page ? `${s.name} ${s.page}` : s.name)).join(" · ")}</p>
        {herb.status === "draft" ? (
          <p>ข้อมูลร่าง — ยังไม่ได้ตรวจทานกับหน้าที่อ้างอิง</p>
        ) : (
          <p>ตรวจกับบัญชียาหลักแห่งชาติด้านสมุนไพรแล้ว</p>
        )}
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
