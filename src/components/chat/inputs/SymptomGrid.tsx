import MaskIcon from "@/components/ui/MaskIcon";
import type { Option } from "@/lib/chat/steps";
import type { SymptomCode } from "@/lib/chat/types";

/* Icons come from symptoms.json (`icon` → /public/icons/<code>.svg), always
   with the Thai label beside them. brand-700 via the button's text colour. */
export default function SymptomGrid({
  options,
  onPick,
}: {
  options: (Option & { icon: string })[];
  onPick: (code: SymptomCode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const code = o.value as SymptomCode;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onPick(code)}
            className="flex min-h-[72px] items-center gap-2 rounded-md border-2 border-brand-700 bg-surface-raised px-2 py-2 text-left text-label text-brand-700 active:bg-brand-100"
          >
            <MaskIcon src={o.icon} className="size-11" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
