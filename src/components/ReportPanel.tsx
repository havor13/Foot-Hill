import SubmitButton from "@/components/SubmitButton";
import { REPORT_REASONS } from "@/lib/moderation";

/**
 * A small "Report" link that opens a form. `action` is a server action already bound to the item being reported.
 * Once the signed-in student has reported the item, it shows "Reported" instead.
 */
export default function ReportPanel({
  action,
  reported,
  id,
  align = "right",
}: {
  action: (formData: FormData) => void | Promise<void>;
  reported: boolean;
  id: string;
  align?: "left" | "right";
}) {
  if (reported) return <span className="text-xs text-muted">Reported</span>;
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none text-xs text-muted underline hover:text-danger [&::-webkit-details-marker]:hidden">Report</summary>
      <form
        action={action}
        className={`absolute z-10 mt-1 grid w-64 gap-2 rounded-xl border border-line bg-surface p-3 text-sm shadow-md ${align === "right" ? "right-0" : "left-0"}`}
      >
        <fieldset className="grid gap-1">
          <legend className="mb-1 font-semibold">Why are you reporting this?</legend>
          {REPORT_REASONS.map((r, i) => (
            <label key={r.value} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="reason" value={r.value} required defaultChecked={i === 0} className="h-4 w-4 accent-[var(--accent)]" />
              {r.label}
            </label>
          ))}
        </fieldset>
        <label className="sr-only" htmlFor={`rd-${id}`}>
          Details (optional)
        </label>
        <input id={`rd-${id}`} name="details" maxLength={500} placeholder="Add details (optional)" className="input" />
        <SubmitButton pendingText="Sending…">Send report</SubmitButton>
        <p className="text-xs text-muted">An admin will look at it. Only admins see who reported.</p>
      </form>
    </details>
  );
}
