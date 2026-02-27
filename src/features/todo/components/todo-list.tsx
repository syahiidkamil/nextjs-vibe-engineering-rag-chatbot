"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/components/ui/card";
import { TodoItem } from "./todo-item";
import type { Todo } from "../types";

const SEED_TODOS: Todo[] = [
  { id: "1", text: "Set up project architecture", completed: true },
  { id: "2", text: "Build feature modules", completed: false },
  { id: "3", text: "Add authentication", completed: false },
];

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(SEED_TODOS);
  const [input, setInput] = useState("");

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
    setInput("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
        <CardDescription>A simple placeholder to demonstrate the architecture.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Add a new todo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" size="sm">
            <PlusIcon />
            Add
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
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
