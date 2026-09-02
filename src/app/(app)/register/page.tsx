import { ListChecks } from "lucide-react";
import type { Metadata } from "next";

import { ImplementationBadge } from "@/components/domain/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Stat, Progress } from "@/components/ui/stat";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { authService } from "@/modules/auth";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { organizationService } from "@/modules/organization";
import { registerService } from "@/modules/register";
import { registerQuerySchema } from "@/modules/register/application/schemas";
import {
  APPLICABILITIES,
  APPLICABILITY_LABELS,
  IMPLEMENTATION_LABELS,
  IMPLEMENTATION_STATUSES,
} from "@/modules/register/domain/entities";
import { hrefBuilder, parseQuery, type SearchParams } from "@/shared/utils/query";

import { RegisterRowEditor } from "./register-row-editor";

export const metadata: Metadata = { title: "Control register" };

const formatDate = (value: Date | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requirePermission("register:read");
  const organizationId = await organizationService.currentId();
  const rawParams = await searchParams;
  const query = parseQuery(registerQuerySchema, rawParams);

  // The register mirrors the catalogue, so a first visit fills it in rather than
  // asking someone to add 93 controls by hand.
  const initialSummary = await registerService.summarise(organizationId);
  if (initialSummary.ok && initialSummary.value.total === 0) {
    const frameworks = await frameworkService.listFrameworks();
    if (frameworks.ok) {
      for (const framework of frameworks.value) {
        await registerService.synchronise({ actor: null, organizationId, frameworkId: framework.id });
      }
    }
  }

  const [summaryResult, entriesResult, usersResult, sites] = await Promise.all([
    registerService.summarise(organizationId),
    registerService.list(organizationId, query),
    authService.listUsers(),
    organizationService.listSites(organizationId),
  ]);

  const summary = summaryResult.ok ? summaryResult.value : null;
  const entries = entriesResult.ok ? entriesResult.value : null;
  const owners = usersResult.ok
    ? usersResult.value
        .filter((user) => user.isActive)
        .map((user) => ({ id: user.id, name: user.fullName }))
    : [];

  const canManage = can(session.role, "register:manage");
  const hrefWith = hrefBuilder("/register", rawParams);

  return (
    <>
      <PageHeader
        title="Control register"
        description="The organisation's own position on every control: who owns it, whether it applies and how far it is implemented."
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Controls in scope"
            value={summary.applicable}
            hint={`${summary.excluded} excluded with justification`}
          />
          <Stat
            label="Implemented"
            value={summary.byStatus.IMPLEMENTED}
            hint={`${summary.byStatus.PARTIALLY_IMPLEMENTED} partially implemented`}
            tone="success"
          />
          <Stat
            label="Without an owner"
            value={summary.unassigned}
            tone={summary.unassigned > 0 ? "warning" : "success"}
          />
          <Stat
            label="Reviews overdue"
            value={summary.overdueReviews}
            tone={summary.overdueReviews > 0 ? "danger" : "success"}
          />
        </div>
      ) : null}

      {summary ? (
        <Card>
          <CardBody>
            <Progress
              value={summary.implementationPercent}
              label="Weighted implementation across applicable controls"
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Controls"
          description="Every control from the catalogue is listed here automatically. Assign an owner and record where implementation stands."
        />

        <CardBody className="space-y-4">
          <FilterBar
            searchPlaceholder="Search by control code or title…"
            filters={[
              {
                key: "status",
                label: "Any implementation status",
                options: IMPLEMENTATION_STATUSES.map((value) => ({
                  value,
                  label: IMPLEMENTATION_LABELS[value],
                })),
              },
              {
                key: "applicability",
                label: "Any applicability",
                className: "h-10 w-44",
                options: APPLICABILITIES.map((value) => ({
                  value,
                  label: APPLICABILITY_LABELS[value],
                })),
              },
              {
                key: "ownerId",
                label: "Any owner",
                options: owners.map((owner) => ({ value: owner.id, label: owner.name })),
              },
            ]}
          />

          {!entries || entries.items.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No control matches these filters"
              description="Clear the filters to see the full register."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Control</TH>
                  <TH>Owner</TH>
                  <TH>Applicability</TH>
                  <TH>Implementation</TH>
                  <TH>Review due</TH>
                  {canManage ? <TH className="text-right">Actions</TH> : null}
                </TR>
              </THead>
              <tbody>
                {entries.items.map((entry) => (
                  <TR key={entry.id}>
                    <TD>
                      <span className="font-mono text-xs font-medium">{entry.controlCode}</span>
                      <span className="mt-0.5 block text-sm">{entry.controlTitle}</span>
                      <span className="text-xs text-content-muted">{entry.themeName}</span>
                    </TD>
                    <TD className="text-sm">
                      {entry.ownerName ?? (
                        <span className="text-content-muted">Unassigned</span>
                      )}
                      {entry.siteName ? (
                        <span className="mt-0.5 block text-xs text-content-muted">
                          {entry.siteName}
                        </span>
                      ) : null}
                    </TD>
                    <TD>
                      <Badge tone={entry.applicability === "APPLICABLE" ? "brand" : "neutral"}>
                        {APPLICABILITY_LABELS[entry.applicability]}
                      </Badge>
                    </TD>
                    <TD>
                      {entry.applicability === "APPLICABLE" ? (
                        <ImplementationBadge status={entry.implementationStatus} />
                      ) : (
                        <span className="text-sm text-content-muted">Out of scope</span>
                      )}
                    </TD>
                    <TD className="text-sm text-content-muted">{formatDate(entry.reviewDueAt)}</TD>
                    {canManage ? (
                      <TD className="text-right">
                        <RegisterRowEditor
                          entry={entry}
                          owners={owners}
                          sites={sites.map((site) => ({ id: site.id, name: site.name }))}
                        />
                      </TD>
                    ) : null}
                  </TR>
                ))}
              </tbody>
            </Table>
          )}

          {entries ? (
            <Pagination
              page={entries.page}
              totalPages={entries.totalPages}
              total={entries.total}
              buildHref={(page) => hrefWith({ page: String(page) })}
            />
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
