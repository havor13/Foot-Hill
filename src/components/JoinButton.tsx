import { joinGroup, leaveGroup } from "@/app/(app)/actions";

export default function JoinButton({
  groupId,
  joined,
  joinLabel = "Join",
}: {
  groupId: string;
  joined: boolean;
  joinLabel?: string;
}) {
  return (
    <form action={(joined ? leaveGroup : joinGroup).bind(null, groupId)}>
      <button type="submit" className={`btn ${joined ? "btn-on" : "btn-primary"}`} aria-pressed={joined}>
        {joined ? "Joined" : joinLabel}
      </button>
    </form>
  );
}
