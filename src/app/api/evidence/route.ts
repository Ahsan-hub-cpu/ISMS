import { requirePermission } from "@/modules/auth/presentation/guards";
import { evidenceService } from "@/modules/evidence";
import {
  createEvidenceSchema,
  evidenceQuerySchema,
} from "@/modules/evidence/application/schemas";
import { organizationService } from "@/modules/organization";
import { parseOrThrow, parseSearchParams, respond, withApiHandler } from "@/shared/api/http";
import { ValidationError } from "@/shared/core/errors";

export const GET = withApiHandler(async (request: Request) => {
  await requirePermission("evidence:read");
  const organizationId = await organizationService.currentId();
  const query = parseSearchParams(request, evidenceQuerySchema);

  return respond(await evidenceService.list(organizationId, query));
});

/**
 * Accepts multipart form data so a document and its metadata arrive together.
 */
export const POST = withApiHandler(async (request: Request) => {
  const actor = await requirePermission("evidence:upload");
  const organizationId = await organizationService.currentId();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ValidationError("Send the evidence as multipart form data.");
  }

  const file = form.get("file");
  const fields = Object.fromEntries(
    [...form.entries()]
      .filter(([key, value]) => key !== "file" && typeof value === "string" && value !== "")
      .map(([key, value]) => [key, value as string]),
  );

  const input = parseOrThrow(createEvidenceSchema, fields);

  return respond(
    await evidenceService.add({
      actor,
      organizationId,
      input,
      file: file instanceof File ? file : null,
    }),
    201,
  );
});
