import { requirePermission } from "@/modules/auth/presentation/guards";
import { frameworkService } from "@/modules/framework";
import { organizationService } from "@/modules/organization";
import { registerService } from "@/modules/register";
import { respond, withApiHandler } from "@/shared/api/http";
import { success } from "@/shared/core/result";

/** Pulls any control that is missing from the register into it. */
export const POST = withApiHandler(async () => {
  const actor = await requirePermission("register:manage");
  const organizationId = await organizationService.currentId();
  const frameworks = await frameworkService.listFrameworks();

  let added = 0;
  if (frameworks.ok) {
    for (const framework of frameworks.value) {
      const result = await registerService.synchronise({
        actor,
        organizationId,
        frameworkId: framework.id,
      });
      if (result.ok) added += result.value.added;
    }
  }

  return respond(success({ added }));
});
