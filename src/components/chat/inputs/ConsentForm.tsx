"use client";

import Link from "next/link";
import { useState } from "react";
import { btn } from "@/components/ui/button";

/* S0b — explicit, NOT pre-ticked consent for health data (PDPA s.26). */
export default function ConsentForm({ onPick }: { onPick: (v: "agree" | "decline") => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 text-body">
        <div>
          <dt className="text-heading">เก็บอะไร</dt>
          <dd>อายุ เพศ โรคประจำตัว ยาที่กิน อาการ</dd>
        </div>
        <div>
          <dt className="text-heading">เพื่ออะไร</dt>
          <dd>แนะนำสมุนไพรที่ปลอดภัย และติดตามอาการ</dd>
        </div>
        <div>
          <dt className="text-heading">สิทธิ์ของคุณ</dt>
          <dd>ดู ดาวน์โหลด หรือลบข้อมูลได้ทุกเมื่อ</dd>
        </div>
        {/* New tab, so leaving to read doesn't lose the chat. */}
        <Link href="/privacy" target="_blank" className="text-label text-brand-700 underline">
          อ่านรายละเอียด
        </Link>
      </dl>

      <label className="flex min-h-tap items-center gap-3 rounded-md border-2 border-brand-700 px-3 text-label text-brand-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="size-7 shrink-0 accent-brand-700"
        />
        <span>ยินยอมให้เก็บข้อมูลสุขภาพ</span>
      </label>

      <button type="button" className={btn.primary} disabled={!agreed} onClick={() => onPick("agree")}>
        ยืนยัน
      </button>
      <button type="button" className={btn.secondary} onClick={() => onPick("decline")}>
        ไม่ยินยอม ใช้แบบไม่บันทึก
      </button>
    </div>
  );
}
