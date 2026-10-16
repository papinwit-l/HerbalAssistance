import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/* /about, /privacy, /me — plain text pages.
   Same 440px column on every screen size; no phone frame on a laptop,
   because judges may open these links directly.
   Each page renders its own <h1> as the first thing in its content. */
export default function InfoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-surface">
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-brand-700 py-1 pr-4 pl-1 text-on-brand">
        <Link
          href="/"
          aria-label="กลับหน้าหลัก"
          /* The global focus ring is brand-800, invisible on this green bar. */
          className="flex size-tap items-center justify-center rounded-md focus-visible:outline-white"
        >
          <ChevronLeft aria-hidden size={28} strokeWidth={2.5} />
        </Link>
        <span className="text-label">ผู้ช่วยสมุนไพร</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
