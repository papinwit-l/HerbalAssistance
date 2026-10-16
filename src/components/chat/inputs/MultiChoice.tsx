"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Option } from "@/lib/chat/steps";
import { btn } from "@/components/ui/button";

type Value = Option["value"];

/* Toggle chips + [ยืนยัน]. The "ไม่มี" chip is exclusive: picking it clears the
   others and vice versa. Confirm stays disabled until something is chosen, so
   nobody skips a safety question by accident. */
export default function MultiChoice({
  options,
  noneLabel,
  onSubmit,
}: {
  options: Option[];
  noneLabel: string;
  onSubmit: (values: Value[]) => void;
}) {
  const [picked, setPicked] = useState<Value[]>([]);
  const [none, setNone] = useState(false);

  const toggle = (v: Value) => {
    setNone(false);
    setPicked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  };
  const toggleNone = () => {
    setPicked([]);
    setNone((n) => !n);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={String(o.value)} label={o.label} on={picked.includes(o.value)} onClick={() => toggle(o.value)} />
        ))}
        <Chip label={noneLabel} on={none} onClick={toggleNone} />
      </div>
      <button
        type="button"
        className={btn.primary}
        disabled={!none && picked.length === 0}
        onClick={() => onSubmit(none ? [] : picked)}
      >
        ยืนยัน
      </button>
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-tap items-center gap-1.5 rounded-pill border-2 border-brand-700 px-4 py-2 text-left text-label ${
        on ? "bg-brand-700 text-on-brand" : "bg-surface-raised text-brand-700"
      }`}
    >
      {on && <Check aria-hidden size={20} strokeWidth={3} className="shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
