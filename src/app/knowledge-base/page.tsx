import { getDocuments, DropZone, FileList } from "@/features/knowledge-base";

export default async function KnowledgeBasePage() {
  const documents = await getDocuments();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">Knowledge Base</h1>
      <p className="mt-1 text-muted-foreground">
        Kelola dokumen yang menjadi sumber pengetahuan chatbot.
      </p>
      <div className="mt-6">
        <DropZone />
      </div>
      <div className="mt-8">
        <FileList documents={documents} />
      </div>
    </div>
  );
}
