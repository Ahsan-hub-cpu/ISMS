import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <span className="rounded-full bg-slate-100 p-3 text-content-muted dark:bg-slate-800">
      <Icon className="size-5" aria-hidden />
    </span>
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto max-w-md text-sm text-content-muted">{description}</p>
    </div>
    {action}
  </div>
);
