import Image from "next/image";

/* The turmeric-in-a-speech-bubble symbol (public/logo). Decorative wherever the
   app name is also written next to it, so alt is empty by default.
   variant: "color" on light backgrounds, "white" on brand-700. */
export default function Logo({
  size,
  variant = "color",
  alt = "",
  className,
}: {
  size: number;
  variant?: "color" | "white";
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src={variant === "white" ? "/logo/logo-white.svg" : "/logo/logo.svg"}
      width={size}
      height={size}
      alt={alt}
      className={className}
      priority
    />
  );
}

/* Persona avatar until น้องขมิ้น's character art exists: the logo in a light circle,
   so the colour version stays readable on the green header. */
export function Avatar({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-pill bg-surface"
      style={{ width: size, height: size }}
    >
      <Logo size={Math.round(size * 0.78)} />
    </span>
  );
}
