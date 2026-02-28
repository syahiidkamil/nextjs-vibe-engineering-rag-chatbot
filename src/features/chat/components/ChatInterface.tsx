"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, RotateCcw, SendHorizonal, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "bot-1",
      role: "model",
      text: "Halo! Selamat datang di Janasku 🌱 <br><br>Ada yang bisa dibantu terkait minuman herbal <em>Jahe, Nanas, dan Kunyit</em> kita hari ini?",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Panggil backend API Route khusus chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Kirim histori percakapan ke backend (dikembalikan ke format context Gemini)
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan respons dari server.");
      }

      const data = await response.json();
      const botReplyText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Maaf, AI tidak dapat memproses jawaban saat ini.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: botReplyText,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: "Terjadi kesalahan jaringan atau server.",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "bot-reset",
        role: "model",
        text: "Sesi chat telah direset. Ada yang bisa Janasku bantu?",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  return (
    <section className="bg-white/30 p-4 rounded-3xl h-full flex flex-col min-h-[500px]">
      <div className="bg-white/85 rounded-3xl h-full flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header */}
        <header className="p-6 border-b border-black/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-[#D97706] to-[#EAB308] rounded-full flex justify-center items-center text-white shadow-[0_4px_10px_rgba(217,119,6,0.3)]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C2B22]">
                Janasku Assistant
              </h2>
              <p className="text-xs text-[#4B5A51] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"></span>{" "}
                Online & learning
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="w-10 h-10 rounded-full border border-white/80 bg-white/50 text-[#4B5A51] flex justify-center items-center transition-all duration-200 hover:bg-white hover:text-[#14532D] hover:-translate-y-0.5"
            title="Clear Chat"
          >
            <RotateCcw size={18} />
          </button>
        </header>

        {/* Chat Area */}
        <div
          className="scrollable flex-1 p-8 overflow-y-auto flex flex-col gap-6"
          ref={scrollRef}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-500 ${
                msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              {msg.role === "model" && (
                <div className="w-8 h-8 bg-[#D97706] text-white rounded-full flex justify-center items-center text-xs font-bold font-fraunces shrink-0">
                  J
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div
                  className={`p-4 text-[0.95rem] leading-relaxed relative shadow-[0_2px_8px_rgba(0,0,0,0.03)] selection:bg-[#D97706] selection:text-white ${
                    msg.role === "user"
                      ? "bg-[#14532D] text-white rounded-[20px_20px_0_20px]"
                      : "bg-white text-[#1C2B22] border border-black/5 rounded-[20px_20px_20px_0]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
                <span
                  className={`text-xs text-[#4B5A51] ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-3 max-w-[85%] self-start animate-in fade-in">
              <div className="w-8 h-8 bg-[#D97706] text-white rounded-full flex justify-center items-center text-xs font-bold font-fraunces shrink-0">
                J
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="bg-white text-[#1C2B22] border border-black/5 rounded-[20px_20px_20px_0] flex items-center gap-1 p-4 h-12">
                  <span
                    className="w-1.5 h-1.5 bg-[#4B5A51] rounded-full animate-bounce"
                    style={{ animationDelay: "-0.32s" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-[#4B5A51] rounded-full animate-bounce"
                    style={{ animationDelay: "-0.16s" }}
                  ></span>
                  <span className="w-1.5 h-1.5 bg-[#4B5A51] rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-transparent">
          <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-black/5 transition-all duration-400 focus-within:shadow-[0_4px_20px_rgba(20,83,45,0.1)] focus-within:border-[#14532D]/20">
            <button
              className="w-11 h-11 rounded-full flex justify-center items-center text-[#4B5A51] hover:bg-[#FAFAF7] transition-colors"
              title="Attach image"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              className="flex-1 border-none bg-transparent p-2 text-base font-outfit text-[#1C2B22] focus:outline-none"
              placeholder="Ketik pesan chat di sini..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 rounded-full flex justify-center items-center bg-[#14532D] text-white hover:bg-[#166534] hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(20,83,45,0.3)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#14532D]"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-[#4B5A51] mt-4">
            AI dapat membuat kesalahan. Periksa pedoman SOP pada panel sebelah
            kiri.
          </p>
        </div>
      </div>
    </section>
  );
}
