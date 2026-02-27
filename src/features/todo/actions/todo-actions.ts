"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/shared/lib/supabase";
import type { Todo } from "../types";

export async function getTodos(): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch todos: ${error.message}`);
  }

  return data;
}

export async function addTodo(formData: FormData) {
  const text = formData.get("text") as string;

  if (!text?.trim()) {
    return { error: "Todo text is required" };
  }

  const { error } = await supabase
    .from("todos")
    .insert({ text: text.trim() });

  if (error) {
    return { error: `Failed to add todo: ${error.message}` };
  }

  revalidatePath("/");
  return { error: null };
}

export async function toggleTodo(id: string) {
  const { data: todo, error: fetchError } = await supabase
    .from("todos")
    .select("completed")
    .eq("id", id)
    .single();

  if (fetchError || !todo) {
    return { error: "Todo not found" };
  }

  const { error } = await supabase
    .from("todos")
    .update({ completed: !todo.completed })
    .eq("id", id);

  if (error) {
    return { error: `Failed to toggle todo: ${error.message}` };
  }

  revalidatePath("/");
  return { error: null };
}

export async function deleteTodo(id: string) {
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    return { error: `Failed to delete todo: ${error.message}` };
  }

  revalidatePath("/");
  return { error: null };
}
