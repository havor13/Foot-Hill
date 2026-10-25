import { requireUser } from "@/lib/session";
import ChatList from "@/components/ChatList";

export const metadata = { title: "Chat" };

export default async function ChatPage() {
  const user = await requireUser();
  return (
    <div className="grid gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
      <ChatList userId={user.id} canStartGroup={user.role === "STUDENT"} />
      <div className="card hidden place-items-center text-center text-muted md:grid">
        <div>
          <h2 className="text-xl font-bold text-ink">Pick a conversation</h2>
          <p className="mt-1">Choose a chat on the left, or start a new one from the People page.</p>
        </div>
      </div>
    </div>
  );
}
