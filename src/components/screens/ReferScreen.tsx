"use client";

import { useEffect, useRef } from "react";
import { btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Logo";
import MaskIcon from "@/components/ui/MaskIcon";

/* R2 — see a doctor, not urgent. Refer orange, persona with her concerned face. */
export default function ReferScreen({
  reason,
  onBack,
  onRestart,
}: {
  reason: string;
  onBack: () => void;
  onRestart: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refer-title"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-refer-50 text-refer-ink"
    >
      <header className="flex items-center gap-3 bg-refer-600 px-4 py-5 text-on-brand">
        <MaskIcon src="/icons/ui/alert-hospital.svg" className="size-10" />
        <h1 id="refer-title" ref={titleRef} tabIndex={-1} className="text-display outline-none">
          ควรให้แพทย์ตรวจ
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 pt-8 pb-4">
        <div className="flex items-end gap-3">
          <Avatar size={64} mood="concerned" />
          <p className="rounded-md rounded-bl-[4px] bg-surface-raised px-4 py-3 text-body-lg text-ink">
            อาการนี้ควรให้แพทย์ตรวจค่ะ แนะนำไปที่ รพ.สต. หรือโรงพยาบาลใกล้บ้านนะคะ
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-md border-2 border-refer-600 bg-surface-raised p-4 text-ink">
          <p className="text-heading">เพราะ</p>
          <p className="text-body">{reason}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        {/* [แสดงข้อมูลให้แพทย์/เภสัชกรดู] arrives with R4. */}
        <button type="button" className={btn.primary} onClick={onRestart}>
          เริ่มใหม่
        </button>
        <button type="button" className={btn.secondary} onClick={onBack}>
          กลับไปแก้คำตอบ
        </button>
      </div>
    </div>
  );
}
