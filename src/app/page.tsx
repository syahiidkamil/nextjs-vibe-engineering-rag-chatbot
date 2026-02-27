import { TodoList, getTodos } from "@/features/todo";

export default async function Home() {
  const todos = await getTodos();

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <TodoList todos={todos} />
    </div>
  );
}
