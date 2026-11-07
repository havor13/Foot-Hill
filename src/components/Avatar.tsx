import { hue, initials } from "@/lib/format";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl",
} as const;

export default function Avatar({
  name,
  image,
  size = "md",
  square = false,
}: {
  name: string;
  image?: string | null;
  size?: keyof typeof SIZES;
  square?: boolean;
}) {
  const shape = square ? "rounded-xl" : "rounded-full";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small user photo from Vercel Blob
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`inline-block shrink-0 bg-surface2 object-cover ${SIZES[size]} ${shape}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center font-semibold tracking-wide text-white ${SIZES[size]} ${shape}`}
      style={{ background: `hsl(${hue(name)} 42% 36%)` }}
    >
      {initials(name)}
    </span>
  );
}
