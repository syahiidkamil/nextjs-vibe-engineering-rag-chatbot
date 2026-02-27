import { TodoList } from "@/features/todo";

export default function Home() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <TodoList />
    </div>
  );
}
