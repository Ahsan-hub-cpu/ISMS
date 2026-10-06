"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export const MarkReadButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const mark = async () => {
    setBusy(true);
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
    setBusy(false);
  };

  return (
    <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={mark}>
      Mark read
    </Button>
  );
};
