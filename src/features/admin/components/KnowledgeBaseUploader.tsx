"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { CloudUpload, FileText, FileType2, Settings2, Trash2 } from "lucide-react";

type UploadedFile = {
  id: string;
  name: string;
  sizeMB: string;
  type: "pdf" | "txt";
};

export function KnowledgeBaseUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".txt") || name.endsWith(".pdf");
    });

    if (validFiles.length === 0) {
      alert("Format file tidak didukung. Gunakan file PDF atau TXT.");
      return;
    }

    for (const file of validFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const newUpload: UploadedFile = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            sizeMB: (file.size / 1024 / 1024).toFixed(4),
            type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "txt",
          };
          setFiles((prev) => [newUpload, ...prev]);
        } else {
          const err = await response.json();
          alert(`Gagal mengunggah ${file.name}: ${err.error}`);
        }
      } catch (error) {
        console.error("Gagal konek API:", error);
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <section className="glass-panel flex flex-col overflow-hidden min-h-[500px]">
      <header className="p-8 flex justify-between items-center border-b border-white/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#14532D] text-white rounded-2xl flex justify-center items-center font-fraunces text-2xl font-bold shadow-[0_4px_12px_rgba(20,83,45,0.2)]">
            J
          </div>
          <div>
            <h1 className="font-fraunces text-3xl text-[#14532D] leading-none">
              Janasku.
            </h1>
            <p className="text-sm text-[#D97706] font-medium tracking-[0.5px] uppercase mt-1">
              Knowledge Brain
            </p>
          </div>
        </div>
        <button
          className="w-10 h-10 rounded-full border border-white/80 bg-white/50 text-[#4B5A51] flex justify-center items-center transition-all duration-200 hover:bg-white hover:text-[#14532D] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          title="Settings"
        >
          <Settings2 size={20} />
        </button>
      </header>

      <div className="scrollable flex-1 p-8 overflow-y-auto">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="font-fraunces text-2xl text-[#14532D]">
              Feed the AI
            </h2>
            <span className="bg-[rgba(217,119,6,0.15)] text-[#D97706] px-3 py-1 rounded-full text-xs font-semibold uppercase">
              Drag & Drop
            </span>
          </div>
          <p className="text-[#4B5A51] mb-6 leading-relaxed">
            Upload your latest SOP, ingredients list, or pricing guides here.
            The AI will learn instantly.
          </p>

          <div
            className={`upload-zone border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-400 cursor-pointer relative overflow-hidden ${
              isDragging
                ? "bg-white/70 border-[#D97706] -translate-y-1 shadow-[0_12px_24px_rgba(217,119,6,0.1)]"
                : "border-[rgba(20,83,45,0.2)] bg-white/30 hover:bg-white/70 hover:border-[#D97706] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(217,119,6,0.1)]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-[rgba(217,119,6,0.15)] rounded-full flex justify-center items-center mx-auto mb-6 text-[#D97706]">
              <CloudUpload size={32} />
            </div>
            <h3 className="text-lg font-semibold text-[#1C2B22] mb-2">
              Drop your documents
            </h3>
            <p className="text-sm text-[#4B5A51] mb-6">
              Supports PDF & TXT (up to 10MB)
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.pdf"
            />
            <button className="px-6 py-3 rounded-xl font-outfit font-medium cursor-pointer transition-colors duration-200 text-[0.95rem] bg-white border border-[#14532D] text-[#14532D] hover:bg-[#14532D] hover:text-white">
              Browse Files
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-fraunces text-2xl text-[#14532D]">
              Active Knowledge
            </h2>
            <span className="bg-[rgba(217,119,6,0.15)] text-[#D97706] px-3 py-1 rounded-full text-xs font-semibold uppercase">
              {files.length}
            </span>
          </div>

          <ul className="flex flex-col gap-4 list-none">
            {files.map((file) => (
              <li
                key={file.id}
                className="bg-white/60 border border-white p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:bg-white hover:translate-x-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] animate-in slide-in-from-bottom-2 fade-in duration-500"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex justify-center items-center ${
                    file.type === "pdf"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {file.type === "pdf" ? <FileText /> : <FileType2 />}
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-[#1C2B22]">
                    {file.name}
                  </h4>
                  <p className="text-xs text-[#4B5A51] mt-1">
                    {file.sizeMB} MB • Just updated
                  </p>
                </div>
                <button
                  className="border-none bg-transparent text-[#4B5A51] cursor-pointer p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500 focus:outline-none"
                  title="Remove context"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
