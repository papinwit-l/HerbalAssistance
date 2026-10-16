import {
  Bandage,
  Bone,
  Droplets,
  Hand,
  Moon,
  Orbit,
  Thermometer,
  Toilet,
  UtensilsCrossed,
  Virus,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { Option } from "@/lib/chat/steps";
import type { SymptomCode } from "@/lib/chat/types";

/* Placeholder outline icons until the designer's set is in /public/icons.
   2px stroke in brand-700, always with the label under/next to them. */
const ICONS: Record<SymptomCode, LucideIcon> = {
  cough_sore_throat: Wind,
  cold_flu: Thermometer,
  covid: Virus,
  muscle_joint_pain: Bone,
  bloating: Waves,
  diarrhea: Droplets,
  constipation_hemorrhoid: Toilet,
  poor_appetite: UtensilsCrossed,
  dizziness: Orbit,
  insomnia: Moon,
  skin_wound: Bandage,
  numbness_paralysis: Hand,
};

export default function SymptomGrid({
  options,
  onPick,
}: {
  options: Option[];
  onPick: (code: SymptomCode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const code = o.value as SymptomCode;
        const Icon = ICONS[code];
        return (
          <button
            key={code}
            type="button"
            onClick={() => onPick(code)}
            className="flex min-h-[64px] items-center gap-2 rounded-md border-2 border-brand-700 bg-surface-raised px-3 py-2 text-left text-label text-brand-700 active:bg-brand-100"
          >
            <Icon aria-hidden size={28} strokeWidth={2} className="shrink-0" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
