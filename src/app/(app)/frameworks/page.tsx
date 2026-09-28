import { ArrowRight, Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";

export const metadata: Metadata = { title: "Frameworks" };

export default async function FrameworksPage() {
  await requirePermission("frameworks:read");

  const result = await frameworkService.listFrameworks();
  const frameworks = result.ok ? result.value : [];

  return (
    <>
      <PageHeader
        eyebrow="Reference data"
        title="Frameworks"
        description="Recognised standards the organisation is assessed against. Every assessment, gap and piece of evidence is linked back to a control in one of these catalogues."
      />

      {frameworks.length === 0 ? (
        <Card>
          <CardBody className="text-sm text-content-muted">
            No framework has been loaded. Run <code className="font-mono">npm run db:seed</code> to
            import the ISO/IEC 27001:2022 catalogue.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {frameworks.map((framework) => (
            <Link
              key={framework.id}
              href={`/frameworks/${framework.code}`}
              className="group surface-card hover-lift flex flex-col gap-4 p-5 hover:border-brand-200 dark:hover:border-brand-800"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900">
                  <Library className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h2 className="font-display font-semibold tracking-tight">{framework.name}</h2>
                  <p className="text-xs text-content-subtle">{framework.publisher}</p>
                </div>
                {framework.isActive ? (
                  <Badge tone="success" dot>
                    Active
                  </Badge>
                ) : null}
              </div>

              <p className="text-sm leading-relaxed text-content-muted">{framework.description}</p>

              <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                Browse controls
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
