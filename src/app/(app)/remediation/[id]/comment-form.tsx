"use client";

import { Loader2, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { postJson } from "@/shared/api/client";

export const CommentForm = ({ actionId }: { actionId: string }) => {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const outcome = await postJson(`/api/remediation/${actionId}/comments`, { body });
    setIsSaving(false);

    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }

    setBody("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <Textarea
        aria-label="Add an update"
        rows={2}
        placeholder="Record what has moved since the last update…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />

      {message ? <p className="text-xs text-rose-600 dark:text-rose-400">{message}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSaving || body.trim().length < 2}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <MessageSquarePlus className="size-4" aria-hidden />
          )}
          Post update
        </Button>
      </div>
    </form>
  );
};
