import { Trash2Icon } from "lucide-react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import type { Todo } from "../types";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-4 py-3">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
      />
      <span
        className={`flex-1 text-sm ${todo.completed ? "text-muted-foreground line-through" : ""}`}
      >
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onDelete(todo.id)}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
