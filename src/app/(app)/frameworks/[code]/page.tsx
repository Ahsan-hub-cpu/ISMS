import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { controlQuerySchema } from "@/modules/framework/application/schemas";
import { cn } from "@/shared/utils/cn";

import { ControlFilters } from "./control-filters";

export const metadata: Metadata = { title: "Control catalogue" };

type SearchParams = Record<string, string | string[] | undefined>;

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
        title={framework.name}
        description={`${controlCount} controls in ${themes.length} themes · published by ${framework.publisher}`}
        actions={<Badge tone="brand">Version {framework.version}</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href={hrefWith({ themeCode: undefined })}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            query.themeCode
              ? "text-content-muted hover:bg-slate-100 dark:hover:bg-slate-800/60"
              : "border-brand-200 bg-brand-50 font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200",
          )}
        >
          All themes
          <span className="ml-2 text-xs text-content-muted">{controlCount}</span>
        </Link>

        {themes.map((theme) => {
          const isActive = query.themeCode === theme.code;

          return (
            <Link
              key={theme.id}
              href={hrefWith({ themeCode: theme.code })}
              title={theme.description}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "border-brand-200 bg-brand-50 font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200"
                  : "text-content-muted hover:bg-slate-100 dark:hover:bg-slate-800/60",
              )}
            >
              {theme.code} {theme.name}
              <span className="ml-2 text-xs text-content-muted">{theme.controlCount}</span>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Controls"
          description="Each entry is a requirement the organisation will be assessed against."
        />

        <CardBody className="space-y-4">
          <ControlFilters />

          {controls.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-content-muted">
              No control matches the current filters.
            </p>
          ) : (
            <ul className="divide-y">
              {controls.items.map((control) => (
                <li key={control.id}>
                  <Link
                    href={`${basePath}/controls/${control.code}`}
                    className="group flex items-start gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-medium dark:bg-slate-800">
                      {control.code}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{control.title}</span>
                      <span className="mt-0.5 block text-sm text-content-muted">
                        {control.purpose}
                      </span>

                      <span className="mt-2 flex flex-wrap gap-1.5">
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
                      className="mt-1 size-4 shrink-0 text-content-muted transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={controls.page}
            totalPages={controls.totalPages}
            total={controls.total}
            buildHref={(page) => hrefWith({ page: String(page) })}
          />
        </CardBody>
      </Card>
    </>
  );
}
