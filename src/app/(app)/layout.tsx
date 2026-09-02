import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getOptionalSession } from "@/modules/auth/presentation/guards";
import { organizationService } from "@/modules/organization";

// Every screen in this group reads live compliance data, so it must not be
// prerendered at build time.
export const dynamic = "force-dynamic";

/**
 * Server components call use cases directly; the /api routes exist for
 * client-side and external consumers, so there is no internal HTTP round trip.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getOptionalSession();

  // Middleware already redirects anonymous visitors; this is the second check
  // that keeps the layout safe if the matcher ever changes.
  if (!session) {
    redirect("/login");
  }

  const result = await organizationService.getProfile();
  const organization = result.ok
    ? result.value.organization
    : { name: "Organization not configured", shortName: "Setup required" };

  return (
    <AppShell
      user={session}
      organizationName={organization.name}
      organizationShortName={organization.shortName}
    >
      {children}
    </AppShell>
  );
}
