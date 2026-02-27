import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { TodoItem } from "./todo-item";
import { AddTodoForm } from "./add-todo-form";
import type { Todo } from "../types";

type TodoListProps = {
  todos: Todo[];
};

export function TodoList({ todos }: TodoListProps) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
        <CardDescription>
          A simple placeholder to demonstrate the architecture.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddTodoForm />

        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
          {todos.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No todos yet. Add one above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
