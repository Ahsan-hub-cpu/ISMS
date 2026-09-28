import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { CONTROL_TYPE_HINTS } from "@/modules/framework/domain/attributes";

interface PageProps {
  params: Promise<{ code: string; controlCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code, controlCode } = await params;
  const result = await frameworkService.getControl(code, controlCode);

  return {
    title: result.ok ? `${result.value.control.code} ${result.value.control.title}` : "Control",
  };
}

export default async function ControlDetailPage({ params }: PageProps) {
  await requirePermission("frameworks:read");

  const { code, controlCode } = await params;
  const result = await frameworkService.getControl(code, controlCode);

  if (!result.ok) {
    notFound();
  }

  const { framework, control, previous, next } = result.value;
  const basePath = `/frameworks/${framework.code}`;

  return (
    <>
      <Link
        href={`${basePath}?themeCode=${control.theme.code}`}
        className="inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {control.theme.code} {control.theme.name}
      </Link>

      <div className="relative space-y-2.5 pb-6">
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-300/70 via-surface-border to-transparent"
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-brand-600 px-2.5 py-1 font-mono text-sm font-semibold text-white shadow-[0_1px_2px_oklch(0.35_0.04_220/0.2),inset_0_1px_0_oklch(1_0_0/0.18)]">
            {control.code}
          </span>
          <Badge>{framework.name}</Badge>
        </div>
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.022em]">
          {control.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-content-muted">{control.purpose}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={BookOpen}
            title="What the framework expects"
            description="Summarised for this project; the published standard remains authoritative."
          />
          <CardBody>
            <p className="text-sm leading-relaxed text-content">{control.description}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={Tags}
            title="Attributes"
            description="Used to filter and group the catalogue."
          />
          <CardBody className="space-y-4">
            <AttributeGroup title="Control type">
              {control.controlTypes.map((type) => (
                <Badge key={type} tone="brand" title={CONTROL_TYPE_HINTS[type]}>
                  {type}
                </Badge>
              ))}
            </AttributeGroup>

            <AttributeGroup title="Security properties">
              {control.securityProperties.map((property) => (
                <Badge key={property} tone="success">
                  {property}
                </Badge>
              ))}
            </AttributeGroup>

            <AttributeGroup title="Cybersecurity concepts">
              {control.cybersecurityConcepts.map((concept) => (
                <Badge key={concept} tone="warning">
                  {concept}
                </Badge>
              ))}
            </AttributeGroup>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          {previous ? (
            <Link
              href={`${basePath}/controls/${previous.code}`}
              className="group flex min-w-0 items-center gap-2.5 text-sm"
              rel="prev"
            >
              <ArrowLeft
                className="size-4 shrink-0 text-content-subtle transition-transform group-hover:-translate-x-1 group-hover:text-brand-600"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-content-subtle">
                  {previous.code}
                </span>
                <span className="block truncate font-medium group-hover:text-brand-800 dark:group-hover:text-brand-200">
                  {previous.title}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link
              href={`${basePath}/controls/${next.code}`}
              className="group flex min-w-0 items-center gap-2.5 text-right text-sm"
              rel="next"
            >
              <span className="min-w-0">
                <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-content-subtle">
                  {next.code}
                </span>
                <span className="block truncate font-medium group-hover:text-brand-800 dark:group-hover:text-brand-200">
                  {next.title}
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-1 group-hover:text-brand-600"
                aria-hidden
              />
            </Link>
          ) : (
            <span />
          )}
        </CardBody>
      </Card>
    </>
  );
}

const AttributeGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-2">
    <p className="eyebrow">{title}</p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);
