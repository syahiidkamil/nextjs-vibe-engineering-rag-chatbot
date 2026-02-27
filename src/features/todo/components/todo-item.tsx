"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { toggleTodo, deleteTodo } from "../actions/todo-actions";
import type { Todo } from "../types";

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleTodo(todo.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTodo(todo.id);
    });
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-4 py-3 ${isPending ? "opacity-50" : ""}`}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <span
        className={`flex-1 text-sm ${todo.completed ? "text-muted-foreground line-through" : ""}`}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
