import Link from "next/link";

/* "/" — the chat app. For now: a static S0 Welcome shell that shows the
   frame contract (fixed header, scrolling messages, fixed answer tray).
   The chat state machine replaces the bubbles and tray later. */
export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header — persona */}
      <header className="flex items-center gap-3 bg-brand-700 px-4 py-3 text-on-brand">
        <div
          aria-hidden
          className="flex size-avatar items-center justify-center rounded-pill border-3 border-turmeric-500 bg-turmeric-100 text-caption font-bold text-ink"
        >
          ขม
        </div>
        <div className="flex flex-col">
          <p className="text-label">น้องขมิ้น</p>
          <p className="text-caption">ผู้ช่วยแนะนำสมุนไพร</p>
        </div>
      </header>

      {/* Messages — the only part that scrolls */}
      <main className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6">
        <p className="max-w-[320px] rounded-md rounded-tl-[4px] bg-brand-100 px-4 py-3 text-body-lg">
          สวัสดีค่ะ หนูชื่อน้องขมิ้น
          ผู้ช่วยแนะนำยาสมุนไพรในบัญชียาหลักแห่งชาติค่ะ
        </p>
        <p className="max-w-[320px] rounded-md bg-brand-100 px-4 py-3 text-body-lg">
          หนูจะถามคำถามสั้นๆ เพื่อแนะนำสมุนไพรที่ปลอดภัยกับคุณ
        </p>
        <p className="max-w-[320px] rounded-md bg-brand-100 px-4 py-3 text-body-lg">
          หนูช่วยแนะนำเบื้องต้นเท่านั้น ไม่ได้แทนแพทย์หรือเภสัชกรนะคะ
        </p>
      </main>

      {/* Answer tray */}
      <div className="flex flex-col gap-2 rounded-t-md bg-surface-raised p-4 shadow-card">
        <button
          type="button"
          className="min-h-tap rounded-md bg-brand-700 text-label text-on-brand active:bg-brand-800"
        >
          เข้าสู่ระบบด้วย LINE
        </button>
        <button
          type="button"
          className="min-h-tap rounded-md border-2 border-brand-700 bg-surface-raised text-label text-brand-700"
        >
          ลองใช้โดยไม่บันทึกข้อมูล
        </button>
        <nav className="flex justify-center gap-2 text-caption">
          <Link
            href="/about"
            className="inline-flex min-h-tap items-center px-3 text-brand-700 underline"
          >
            เกี่ยวกับ
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-tap items-center px-3 text-brand-700 underline"
          >
            ความเป็นส่วนตัว
          </Link>
        </nav>
      </div>
    </div>
  );
}
