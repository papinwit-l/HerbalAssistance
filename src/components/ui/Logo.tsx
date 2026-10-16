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

export type Mood = "happy" | "wave" | "concerned" | "turmeric";

/* น้องขมิ้น (public/persona, cropped from the persona sheets).
   happy = default · wave = welcome · concerned = refer / nothing to recommend · turmeric = herbs found.
   Decorative: her name or words are always written next to her. */
export function Avatar({ size = 40, mood = "happy" }: { size?: number; mood?: Mood }) {
  return (
    <Image
      src={`/persona/${mood}.webp`}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className="shrink-0 rounded-pill bg-surface"
      style={{ width: size, height: size }}
    />
  );
}
