import { Pencil } from "lucide-react";

/* น้องขมิ้น's bubbles: left, brand tint, one 4px corner toward her on the first. */
export function PersonaBubbles({ bubbles }: { bubbles: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {bubbles.map((text, i) => (
        <p
          key={i}
          className={`max-w-[85%] self-start rounded-md bg-brand-100 px-4 py-3 text-body-lg ${
            i === 0 ? "rounded-tl-[4px]" : ""
          }`}
        >
          {text}
        </p>
      ))}
    </div>
  );
}

/* The user's answer: right, white with a green edge. Tapping it re-asks that question. */
export function UserBubble({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`${label} — แตะเพื่อแก้คำตอบ`}
      className="flex max-w-[85%] items-center gap-2 self-end rounded-md rounded-tr-[4px] border-2 border-brand-700 bg-surface-raised px-4 py-2 text-left text-body-lg font-semibold"
    >
      <span>{label}</span>
      <Pencil aria-hidden size={16} className="shrink-0 text-ink-muted" />
    </button>
  );
}
