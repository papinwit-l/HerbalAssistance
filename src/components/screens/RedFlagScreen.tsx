"use client";

import { Phone } from "lucide-react";
import { useEffect, useRef } from "react";
import MaskIcon from "@/components/ui/MaskIcon";

/* R1 — full screen, danger red, NO persona, NO herbs.
   `fixed inset-0`: covers the phone screen; on a laptop the (chat) frame's
   transform keeps it inside the phone frame. */
export default function RedFlagScreen({ signs, onBack }: { signs: string[]; onBack: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="redflag-title"
      className="fixed inset-0 z-50 flex flex-col gap-8 overflow-y-auto bg-danger-600 px-6 pt-12 pb-8 text-on-brand"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <MaskIcon src="/icons/ui/alert-warning.svg" className="size-20" />
        <h1 id="redflag-title" ref={titleRef} tabIndex={-1} className="text-display outline-none">
          อาการนี้อาจเป็นอันตราย
        </h1>
      </div>

      <div className="flex flex-col gap-3 rounded-md bg-danger-50 p-5 text-danger-ink">
        <p className="text-title">กรุณาไปโรงพยาบาลทันที หรือโทร 1669</p>
        <p className="text-body">อาการที่พบ: {signs.join(", ")}</p>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <a
          href="tel:1669"
          className="flex min-h-[80px] items-center justify-center gap-3 rounded-md bg-white text-[28px] leading-9 font-bold text-danger-600 focus-visible:outline-white"
        >
          <Phone aria-hidden size={32} strokeWidth={2.5} />
          โทร 1669
        </a>
        <button
          type="button"
          onClick={onBack}
          className="min-h-tap rounded-md border-2 border-white text-label text-on-brand focus-visible:outline-white"
        >
          กลับ
        </button>
      </div>
    </div>
  );
}
