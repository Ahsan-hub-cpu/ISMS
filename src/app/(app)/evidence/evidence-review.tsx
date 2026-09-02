"use client";

import { Check, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, patchJson } from "@/shared/api/client";

interface EvidenceReviewProps {
  evidenceId: string;
  isPending: boolean;
}

export const EvidenceReview = ({ evidenceId, isPending }: EvidenceReviewProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const review = async (reviewStatus: "ACCEPTED" | "REJECTED") => {
    setMessage(null);
    setBusy(reviewStatus);

    const outcome = await patchJson(`/api/evidence/${evidenceId}`, {
      reviewStatus,
      reviewNote: note.trim() || undefined,
    });

    setBusy(null);

    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }

    setRejecting(false);
    setNote("");
    router.refresh();
  };

  const remove = async () => {
    setMessage(null);
    setBusy("DELETE");

    const outcome = await apiRequest(`/api/evidence/${evidenceId}`, { method: "DELETE" });
    setBusy(null);

    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {rejecting ? (
        <div className="flex w-64 flex-col gap-2">
          <Input
            aria-label="Reason for rejection"
            placeholder="Why is this not acceptable?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => review("REJECTED")} disabled={busy !== null}>
              {busy === "REJECTED" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              Confirm rejection
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {isPending ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => review("ACCEPTED")} disabled={busy !== null}>
                {busy === "ACCEPTED" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Check className="size-3.5" aria-hidden />
                )}
                Accept
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejecting(true)}>
                <X className="size-3.5" aria-hidden />
                Reject
              </Button>
            </>
          ) : null}

          <Button size="sm" variant="ghost" onClick={remove} disabled={busy !== null} aria-label="Delete evidence">
            {busy === "DELETE" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      )}

      {message ? (
        <p className="text-right text-xs text-rose-600 dark:text-rose-400">{message}</p>
      ) : null}
    </div>
  );
};
