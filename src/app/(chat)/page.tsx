import Chat from "@/components/chat/Chat";
import { loadHerbs } from "@/lib/engine/herbSource.server";

/* "/" — the whole chat (every S0–S11 and R1–R4 state lives inside <Chat />).
   Herbs come from MySQL via the PHP export, refreshed at most every 5 minutes. */
export const revalidate = 300;

export default async function ChatPage() {
  const { herbs } = await loadHerbs();
  return <Chat herbs={herbs} />;
}
