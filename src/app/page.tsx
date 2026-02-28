import { KnowledgeBaseUploader } from "@/features/admin/components/KnowledgeBaseUploader";
import { ChatInterface } from "@/features/chat/components/ChatInterface";

export default function Home() {
  return (
    <main>
      {/* Organic Background Blobs */}
      <div className="blob-bg">
        <div className="blob blob-turmeric"></div>
        <div className="blob blob-pineapple"></div>
        <div className="blob blob-ginger"></div>
      </div>

      <div className="flex justify-center items-center min-h-screen p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl h-auto lg:h-[calc(100vh-4rem)]">
          {/* Left Panel: Context Manager (Admin) */}
          <KnowledgeBaseUploader />

          {/* Right Panel: Chat Interface (Simulation) */}
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
