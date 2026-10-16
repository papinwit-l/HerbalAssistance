/* Shared button looks. Every tappable thing is at least min-h-tap (56px). */

const base =
  "inline-flex min-h-tap w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-label text-center disabled:cursor-not-allowed disabled:opacity-40";

export const btn = {
  primary: `${base} bg-brand-700 text-on-brand active:bg-brand-800`,
  secondary: `${base} border-2 border-brand-700 bg-surface-raised text-brand-700 active:bg-brand-100`,
} as const;
