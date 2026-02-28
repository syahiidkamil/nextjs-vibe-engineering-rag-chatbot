"use client";

import { useState } from "react";
import { PanelLeftIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { ChatSidebar } from "./chat-sidebar";
import { ChatContainer } from "./chat-container";

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-[calc(100svh-3.5rem)]">
      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="hidden w-72 shrink-0 border-r md:block">
          <ChatSidebar />
        </aside>
      )}

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sidebar toggle bar */}
        <div className="flex items-center gap-1 border-b px-2 py-1">
          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 md:inline-flex"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <PanelLeftIcon className="size-4" />
          </Button>

          {/* Mobile: Sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 md:hidden"
              >
                <PanelLeftIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Riwayat Percakapan</SheetTitle>
              <ChatSidebar />
            </SheetContent>
          </Sheet>
        </div>

        <ChatContainer />
      </div>
    </div>
  );
}
