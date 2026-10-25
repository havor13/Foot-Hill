import SubmitButton from "@/components/SubmitButton";
import { createEvent } from "@/app/(app)/actions";

export default function EventForm({ groupId, label }: { groupId: string; label: string }) {
  return (
    <details className="card">
      <summary className="cursor-pointer font-semibold text-accent">{label}</summary>
      <form action={createEvent} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="groupId" value={groupId} />
        <label className="label sm:col-span-2" htmlFor={`et-${groupId}`}>
          Title
          <input id={`et-${groupId}`} name="title" required maxLength={100} className="input" />
        </label>
        <label className="label" htmlFor={`ew-${groupId}`}>
          When (Provo time)
          <input id={`ew-${groupId}`} name="startsAt" type="datetime-local" required className="input" />
        </label>
        <label className="label" htmlFor={`el-${groupId}`}>
          Where
          <input id={`el-${groupId}`} name="location" required maxLength={120} className="input" />
        </label>
        <label className="label sm:col-span-2" htmlFor={`ed-${groupId}`}>
          Details (optional)
          <textarea id={`ed-${groupId}`} name="description" rows={2} maxLength={500} className="input" />
        </label>
        <div className="sm:col-span-2">
          <SubmitButton pendingText="Saving…">Create event</SubmitButton>
        </div>
      </form>
    </details>
  );
}
