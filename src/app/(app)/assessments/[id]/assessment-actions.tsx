"use client";

import { CheckCheck, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AssessmentStatus } from "@/modules/assessment/domain/entities";
import { postJson } from "@/shared/api/client";

interface AssessmentActionsProps {
  assessmentId: string;
  status: AssessmentStatus;
  canConduct: boolean;
  canApprove: boolean;
}

export const AssessmentActions = ({
  assessmentId,
  status,
  canConduct,
  canApprove,
}: AssessmentActionsProps) => {
  const router = useRouter();
  const [pending, setPending] = useState<"SUBMITTED" | "APPROVED" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (target: "SUBMITTED" | "APPROVED") => {
    setMessage(null);
    setPending(target);

    const outcome = await postJson(`/api/assessments/${assessmentId}/status`, { target });
    setPending(null);

    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }

    router.refresh();
  };

  const showSubmit = canConduct && (status === "DRAFT" || status === "IN_PROGRESS");
  const showApprove = canApprove && status === "SUBMITTED";

  if (!showSubmit && !showApprove) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {showSubmit ? (
          <Button size="sm" onClick={() => run("SUBMITTED")} disabled={pending !== null}>
            {pending === "SUBMITTED" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Submit for approval
          </Button>
        ) : null}

        {showApprove ? (
          <Button size="sm" onClick={() => run("APPROVED")} disabled={pending !== null}>
            {pending === "APPROVED" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-4" aria-hidden />
            )}
            Approve
          </Button>
        ) : null}
      </div>

      {message ? (
        <p className="max-w-xs text-right text-xs text-rose-600 dark:text-rose-400">{message}</p>
      ) : null}
    </div>
  );
};
