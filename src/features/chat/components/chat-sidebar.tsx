"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  MessageSquareIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  getConversations,
  renameConversation,
  deleteConversation,
} from "../actions/conversation-actions";
import { RenameDialog } from "./rename-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import type { Conversation } from "../types";

export function ChatSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("c");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // Silently fail — sidebar is non-critical
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, [loadConversations, activeId]);

  function handleNewChat() {
    router.push("/chat");
  }

  function handleSelectConversation(id: string) {
    router.push(`/chat?c=${id}`);
  }

  async function handleRename(newTitle: string) {
    if (!renameTarget) return;
    await renameConversation(renameTarget.id, newTitle);
    setRenameTarget(null);
    loadConversations();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    await deleteConversation(deletedId);
    setDeleteTarget(null);
    loadConversations();
    // If we deleted the active conversation, go back to /chat
    if (activeId === deletedId) {
      router.push("/chat");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <PlusIcon className="size-4" />
          Percakapan Baru
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-1 rounded-md pr-1 ${
                activeId === conv.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <button
                onClick={() => handleSelectConversation(conv.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
              >
                <MessageSquareIcon className="size-4 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRenameTarget(conv)}>
                    <PencilIcon className="mr-2 size-4" />
                    Ubah Nama
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(conv)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Belum ada percakapan
            </p>
          )}
        </div>
      </ScrollArea>

      {renameTarget && (
        <RenameDialog
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          currentTitle={renameTarget.title}
          onRename={handleRename}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={deleteTarget.title}
        />
      )}
    </div>
  );
}
