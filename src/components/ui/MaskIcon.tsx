/* Shows a single-colour SVG from /public in the current text colour.
   The icon files use fill="currentColor", which an <img> can't inherit,
   so the SVG is used as a mask over a `bg-current` box instead.
   Size it with Tailwind (size-10 …), colour it with text-* on it or a parent. */
export default function MaskIcon({ src, className = "" }: { src: string; className?: string }) {
  const url = `url("${src}")`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
