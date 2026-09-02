import { organizationService } from "@/modules/organization";
import { respond, withApiHandler } from "@/shared/api/http";

export const GET = withApiHandler(async () => {
  const result = await organizationService.getProfile();
  return respond(result);
});
