import { ScrollText } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardToolbar } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { AUDIT_ACTION_LABELS, auditService } from "@/modules/audit";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { paginationSchema } from "@/shared/core/pagination";
import { hrefBuilder, type SearchParams } from "@/shared/utils/query";

export const metadata: Metadata = { title: "Audit log" };

const formatDateTime = (value: Date) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("audit:read");
  const rawParams = await searchParams;

  const parsed = paginationSchema.safeParse(rawParams);
  const pagination = parsed.success ? parsed.data : paginationSchema.parse({});
  const entityType = typeof rawParams.entityType === "string" ? rawParams.entityType : undefined;

  const [entriesResult, entityTypes] = await Promise.all([
    auditService.list({ ...pagination, entityType }),
    auditService.listEntityTypes(),
  ]);

  const entries = entriesResult.ok ? entriesResult.value : null;
  const hrefWith = hrefBuilder("/admin/audit-log", rawParams);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Who changed what, and when. Entries are written automatically and cannot be edited."
      />

      <Card>
        <CardHeader icon={ScrollText} title="History" description="Most recent first." />

        <CardToolbar>
          <FilterBar
            filters={[
              {
                key: "entityType",
                label: "All record types",
                className: "h-10 w-56",
                options: entityTypes.map((type) => ({ value: type, label: type })),
              },
            ]}
          />
        </CardToolbar>

        <CardBody className="p-0">
          {!entries || entries.items.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Nothing recorded yet"
              description="Entries appear as soon as people start assessing controls and updating records."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Who</TH>
                  <TH>Action</TH>
                  <TH>What happened</TH>
                </TR>
              </THead>
              <tbody>
                {entries.items.map((entry) => (
                  <TR key={entry.id}>
                    <TD className="whitespace-nowrap text-xs text-content-muted">
                      {formatDateTime(entry.createdAt)}
                    </TD>
                    <TD className="text-sm">
                      <span className="block font-medium">{entry.actorName}</span>
                      <span className="text-xs text-content-muted">{entry.actorEmail}</span>
                    </TD>
                    <TD>
                      <Badge>{AUDIT_ACTION_LABELS[entry.action]}</Badge>
                      <span className="mt-1 block text-xs text-content-muted">
                        {entry.entityType}
                      </span>
                    </TD>
                    <TD className="text-sm">{entry.summary}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {entries ? (
            <div className="px-5 pb-4">
              <Pagination
                page={entries.page}
                totalPages={entries.totalPages}
                total={entries.total}
                buildHref={(page) => hrefWith({ page: String(page) })}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
