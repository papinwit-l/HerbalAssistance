import DemoAside from "@/components/layout/DemoAside";

/* The chat app at "/".
   Phone: full screen, max 440px wide.
   Laptop (lg+): the same app inside a phone frame, with a QR code beside it
   for judges.

   Contract for pages in this group:
   - The page fills the frame: its root is `flex flex-1 min-h-0 flex-col`.
     Header and answer tray stay put; only the message list scrolls
     (`flex-1 overflow-y-auto`).
   - Full-screen alerts (R1 RED FLAG, R2 REFER) use `fixed inset-0`.
     On a phone that covers the screen. On a laptop the frame's transform
     makes it the containing block, so the red stays INSIDE the phone frame
     instead of turning the whole browser red. */
export default function ChatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh lg:flex lg:items-center lg:justify-center lg:gap-24 lg:bg-brand-100 lg:p-8">
      {/* Phone bezel — only drawn on lg+. */}
      <div className="lg:rounded-[48px] lg:bg-ink lg:p-3 lg:shadow-card">
        <div className="relative mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-surface lg:h-[min(860px,calc(100dvh-5rem))] lg:w-[var(--container-app)] lg:rounded-[36px] lg:[transform:translateZ(0)]">
          {children}
        </div>
      </div>

      <DemoAside />
    </div>
  );
}
