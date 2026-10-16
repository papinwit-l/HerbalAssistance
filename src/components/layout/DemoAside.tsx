"use client";

import { QRCodeSVG } from "qrcode.react";

/* Set NEXT_PUBLIC_APP_URL to the deployed URL (e.g. the Vercel URL).
   Without it the QR is replaced by a note, so a wrong QR never reaches a judge. */
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

/* Laptop-only side panel next to the phone frame. Hidden below lg. */
export default function DemoAside() {
  const host = appUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <aside
      aria-label="เปิดบนมือถือ"
      className="hidden w-[380px] flex-col gap-6 lg:flex"
    >
      <div className="flex flex-col gap-2">
        <p className="text-display text-brand-800">ผู้ช่วยสมุนไพร</p>
        <p className="text-body-lg">
          น้องขมิ้นช่วยเลือกยาสมุนไพรในบัญชียาหลักแห่งชาติ ที่ปลอดภัยกับคุณ
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-md bg-surface-raised p-6 shadow-card">
        {appUrl ? (
          <QRCodeSVG
            value={appUrl}
            size={220}
            level="M"
            marginSize={2}
            fgColor="#2a2116" /* ink */
            bgColor="#ffffff"
            title="QR code สำหรับเปิดผู้ช่วยสมุนไพรบนมือถือ"
          />
        ) : (
          <p className="flex size-[220px] items-center justify-center rounded-sm border-2 border-dashed border-border p-4 text-center text-caption text-ink-muted">
            ตั้งค่า NEXT_PUBLIC_APP_URL เพื่อแสดง QR code
          </p>
        )}
        <p className="text-heading text-center">สแกนเพื่อลองบนมือถือของคุณ</p>
        {host && (
          <p className="text-caption text-ink-muted">
            {host} · เปิดใน LINE ได้
          </p>
        )}
      </div>

      <p className="text-caption text-ink-muted">
        แนะนำเบื้องต้นเท่านั้น ไม่ได้แทนแพทย์หรือเภสัชกร · ฉุกเฉินโทร 1669
      </p>
    </aside>
  );
}
