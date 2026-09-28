import { ChevronRight, Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardToolbar } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { controlQuerySchema } from "@/modules/framework/application/schemas";
import { cn } from "@/shared/utils/cn";

import { ControlFilters } from "./control-filters";

export const metadata: Metadata = { title: "Control catalogue" };

type SearchParams = Record<string, string | string[] | undefined>;

const pillClass =
  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8125rem] transition-colors";
const pillActiveClass =
  "border-brand-300 bg-brand-50 font-semibold text-brand-800 shadow-[0_1px_2px_oklch(0.35_0.04_220/0.06)] dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-200";
const pillIdleClass =
  "border-surface-border bg-surface-raised text-content-muted hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800 dark:hover:bg-brand-950/40 dark:hover:text-brand-200";

const toQueryString = (params: SearchParams, overrides: Record<string, string | undefined>) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }

  return search.toString();
};

export default async function FrameworkCataloguePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("frameworks:read");

  const { code } = await params;
  const rawParams = await searchParams;

  // Unknown or malformed filters fall back to the defaults instead of erroring.
  const parsedQuery = controlQuerySchema.safeParse(rawParams);
  const query = parsedQuery.success ? parsedQuery.data : controlQuerySchema.parse({});

  const [catalogueResult, controlsResult] = await Promise.all([
    frameworkService.getCatalogue(code),
    frameworkService.searchControls(code, query),
  ]);

  if (!catalogueResult.ok || !controlsResult.ok) {
    notFound();
  }

  const { framework, themes, controlCount } = catalogueResult.value;
  const controls = controlsResult.value;

  const basePath = `/frameworks/${framework.code}`;
  const hrefWith = (overrides: Record<string, string | undefined>) => {
    const queryString = toQueryString(rawParams, { page: undefined, ...overrides });
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <>
      <PageHeader
        eyebrow="Control catalogue"
        title={framework.name}
        description={`${controlCount} controls in ${themes.length} themes · published by ${framework.publisher}`}
        actions={<Badge tone="brand">Version {framework.version}</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefWith({ themeCode: undefined })}
          className={cn(
            pillClass,
            query.themeCode ? pillIdleClass : pillActiveClass,
          )}
        >
          All themes
          <span className={query.themeCode ? "text-content-subtle" : "text-brand-600"}>
            {controlCount}
          </span>
        </Link>

        {themes.map((theme) => {
          const isActive = query.themeCode === theme.code;

          return (
            <Link
              key={theme.id}
              href={hrefWith({ themeCode: theme.code })}
              title={theme.description}
              className={cn(pillClass, isActive ? pillActiveClass : pillIdleClass)}
            >
              {theme.code} {theme.name}
              <span className={isActive ? "text-brand-600" : "text-content-subtle"}>
                {theme.controlCount}
              </span>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader
          icon={Library}
          title="Controls"
          description="Each entry is a requirement the organisation will be assessed against."
        />

        <CardToolbar>
          <ControlFilters />
        </CardToolbar>

        <CardBody className="p-0">
          {controls.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-content-muted">
              No control matches the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {controls.items.map((control) => (
                <li key={control.id}>
                  <Link
                    href={`${basePath}/controls/${control.code}`}
                    className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/25"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-brand-50 px-2 py-1 font-mono text-xs font-semibold text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-950/60 dark:text-brand-200 dark:ring-brand-900">
                      {control.code}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-content">
                        {control.title}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-relaxed text-content-muted">
                        {control.purpose}
                      </span>

                      <span className="mt-2.5 flex flex-wrap gap-1.5">
                        {control.controlTypes.map((type) => (
                          <Badge key={type} tone="brand">
                            {type}
                          </Badge>
                        ))}
                        {control.securityProperties.map((property) => (
                          <Badge key={property}>{property.charAt(0)}</Badge>
                        ))}
                      </span>
                    </span>

                    <ChevronRight
                      className="mt-1 size-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-1 group-hover:text-brand-600"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="px-5 pb-4 pt-1">
            <Pagination
              page={controls.page}
              totalPages={controls.totalPages}
              total={controls.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
}
