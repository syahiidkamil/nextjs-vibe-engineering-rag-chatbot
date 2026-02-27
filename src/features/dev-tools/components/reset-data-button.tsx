"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ConfirmResetDialog } from "./confirm-reset-dialog";

export function ResetDataButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowDialog(true)}
      >
        <Trash2Icon className="mr-2 size-4" />
        Reset Semua Data
      </Button>
      <ConfirmResetDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
