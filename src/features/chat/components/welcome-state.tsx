import { BotIcon, SparklesIcon } from "lucide-react";

type WelcomeStateProps = {
  onSuggestionClick: (text: string) => void;
};

const suggestions = [
  "Janasku terbuat dari apa?",
  "Bagaimana cara minum Janasku?",
  "Apakah aman untuk ibu hamil?",
  "Apa manfaat Janasku?",
];

export function WelcomeState({ onSuggestionClick }: WelcomeStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
        <BotIcon className="size-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Halo! Saya Chatbot Janasku.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saya siap membantu menjawab pertanyaan seputar produk kami berdasarkan
          dokumen Knowledge Base.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={() => onSuggestionClick(text)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-secondary"
          >
            <SparklesIcon className="size-3.5 text-primary" />
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
