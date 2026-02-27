"use client";

import { useActionState } from "react";
import { Input } from "@/shared/components/ui/input";
import { addTodo } from "../actions/todo-actions";
import { SubmitButton } from "./submit-button";

export function AddTodoForm() {
  const [state, formAction] = useActionState(
    async (_prevState: { error: string | null }, formData: FormData) => {
      return await addTodo(formData);
    },
    { error: null }
  );

  return (
    <form action={formAction} className="flex gap-2">
      <Input name="text" placeholder="Add a new todo..." required />
      <SubmitButton />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
