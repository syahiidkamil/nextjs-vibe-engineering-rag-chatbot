import { Suspense } from "react";
import { ChatLayout } from "@/features/chat";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatLayout />
    </Suspense>
  );
}
