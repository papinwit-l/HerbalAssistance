"use client";

import { useState } from "react";
import type { Herb } from "@/lib/engine/herbs";
import { countText, STRENGTHS_MG, tabletCount } from "@/lib/engine/doseCount";

/* "บนกล่องเขียนว่าเม็ดละกี่มิลลิกรัม?" → "ครั้งละ 3–6 เม็ด".
   The count comes from the list's dose (herbs.json dose_mg), never from guesswork. */
export default function DoseCounter({ dose }: { dose: NonNullable<Herb["dose_mg"]> }) {
  const [strength, setStrength] = useState<number | null>(null);
  const count = strength ? tabletCount(dose.min, dose.max, strength) : null;
  const per = dose.per === "day" ? "ทั้งวันรวมกัน" : "ครั้งละ";

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-raised p-3">
      <p className="text-body font-semibold">นับเป็นเม็ด: บนกล่องเขียนว่า{dose.unit}ละกี่มิลลิกรัม?</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ขนาดต่อเม็ดบนกล่อง">
        {STRENGTHS_MG.map((mg) => (
          <button
            key={mg}
            type="button"
            role="radio"
            aria-checked={strength === mg}
            onClick={() => setStrength(mg)}
            className={`min-h-11 rounded-pill border-2 px-4 text-body font-semibold ${
              strength === mg
                ? "border-brand-700 bg-brand-700 text-on-brand"
                : "border-brand-700 bg-surface-raised text-brand-800"
            }`}
          >
            {mg} มก.
          </button>
        ))}
      </div>
      {strength !== null && (
        <p className="text-body-lg font-semibold" aria-live="polite">
          {count
            ? `${per} ${countText(count)} เม็ด`
            : "ขนาดนี้แบ่งเป็นเม็ดให้พอดีไม่ได้ ทำตามฉลาก หรือถามเภสัชกรนะคะ"}
        </p>
      )}
      <p className="text-caption text-ink-muted">ไม่มีขนาดที่ตรงกับกล่อง? ทำตามฉลาก หรือถามเภสัชกร</p>
    </div>
  );
}
