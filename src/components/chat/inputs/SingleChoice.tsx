import type { Option } from "@/lib/chat/steps";
import { btn } from "@/components/ui/button";

/* One tap sends. Full-width buttons, stacked: the biggest possible targets. */
export default function SingleChoice({
  options,
  onPick,
  primaryFirst = false,
}: {
  options: Option[];
  onPick: (value: Option["value"]) => void;
  primaryFirst?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          type="button"
          className={primaryFirst && i === 0 ? btn.primary : btn.secondary}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
