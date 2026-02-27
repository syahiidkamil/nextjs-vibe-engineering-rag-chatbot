"use client";

import { useFormStatus } from "react-dom";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      <PlusIcon />
      {pending ? "Adding..." : "Add"}
    </Button>
  );
}
