import { hue, initials } from "@/lib/format";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

export default function Avatar({
  name,
  size = "md",
  square = false,
}: {
  name: string;
  size?: keyof typeof SIZES;
  square?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center font-semibold tracking-wide text-white ${SIZES[size]} ${square ? "rounded-xl" : "rounded-full"}`}
      style={{ background: `hsl(${hue(name)} 42% 36%)` }}
    >
      {initials(name)}
    </span>
  );
}
