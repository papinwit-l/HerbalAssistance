import { Avatar } from "@/components/ui/Logo";

/* Persona header + turmeric progress bar. */
export default function ChatHeader({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div>
      <header className="flex items-center gap-3 bg-brand-700 px-4 py-3 text-on-brand">
        <Avatar />
        <div className="flex flex-col">
          <p className="text-label">น้องขมิ้น</p>
          <p className="text-caption">ผู้ช่วยแนะนำสมุนไพร</p>
        </div>
      </header>
      <div
        role="progressbar"
        aria-label="ความคืบหน้า"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 bg-brand-800"
      >
        <div
          className="h-full rounded-r-pill bg-turmeric-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
