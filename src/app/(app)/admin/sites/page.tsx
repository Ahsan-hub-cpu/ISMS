import type { Metadata } from "next";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { can } from "@/modules/auth/domain/permissions";
import { requirePermission } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";

import { CreateSiteForm } from "./create-site-form";

export const metadata: Metadata = { title: "Sites" };

export default async function SitesPage() {
  const session = await requirePermission("organization:manage");
  const canManage = can(session, "organization:manage");
  const organizationId = await organizationService.currentId();
  const sites = await organizationService.listSites(organizationId);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Sites"
        description="Locations the ISMS covers — offices, branches, data centres. They appear in the control register and user assignments."
        actions={canManage ? <CreateSiteForm /> : null}
      />

      <Card>
        <CardHeader
          icon={MapPin}
          title="Current sites"
          description={`${sites.length} site${sites.length === 1 ? "" : "s"} in the organisation.`}
        />
        <CardBody className="p-0">
          {sites.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No sites yet"
              description="Add the first site so controls and users can be scoped to a location."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH>Region</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <tbody>
                {sites.map((site) => (
                  <TR key={site.id}>
                    <TD className="font-mono text-xs">{site.code}</TD>
                    <TD className="font-medium">{site.name}</TD>
                    <TD className="text-content-muted">{site.region ?? "—"}</TD>
                    <TD>
                      <Badge tone={site.isActive ? "success" : "neutral"} dot>
                        {site.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
