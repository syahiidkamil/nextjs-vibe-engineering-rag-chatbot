import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

type ErrorMessageProps = {
  onRetry: () => void;
};

export function ErrorMessage({ onRetry }: ErrorMessageProps) {
  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
      <AlertCircleIcon className="size-5 shrink-0 text-destructive" />
      <p className="flex-1 text-sm">
        Gagal mendapat jawaban. Silakan coba lagi.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Coba Lagi
      </Button>
    </div>
  );
}
