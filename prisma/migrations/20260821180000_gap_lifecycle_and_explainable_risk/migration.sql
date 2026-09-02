-- Gap lifecycle gains IN_PROGRESS and AWAITING_REVIEW so a control being
-- reassessed as compliant parks the gap for assessor verification instead of
-- closing it, and gaps carry the scoring factors behind their risk rating.

-- AlterEnum: two new audit actions for verification and rejection.
ALTER TYPE "AuditAction" ADD VALUE 'VERIFY';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT';

-- AlterEnum: replace IN_REMEDIATION with the new working and review states.
BEGIN;
CREATE TYPE "GapStatus_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_REVIEW', 'RESOLVED', 'RISK_ACCEPTED');
ALTER TABLE "public"."gaps" ALTER COLUMN "status" DROP DEFAULT;
-- Existing gaps under remediation map onto the new IN_PROGRESS state.
ALTER TABLE "gaps"
  ALTER COLUMN "status" TYPE "GapStatus_new"
  USING (CASE WHEN "status"::text = 'IN_REMEDIATION' THEN 'IN_PROGRESS' ELSE "status"::text END)::"GapStatus_new";
ALTER TYPE "GapStatus" RENAME TO "GapStatus_old";
ALTER TYPE "GapStatus_new" RENAME TO "GapStatus";
DROP TYPE "public"."GapStatus_old";
ALTER TABLE "gaps" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable: explainable risk, draft-versus-confirmed wording and verification.
ALTER TABLE "gaps"
  ADD COLUMN "descriptionEditedAt"     TIMESTAMP(3),
  ADD COLUMN "recommendationEditedAt"  TIMESTAMP(3),
  ADD COLUMN "riskFactors"             JSONB   NOT NULL DEFAULT '[]',
  ADD COLUMN "riskMaximumScore"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "riskModelVersion"        TEXT    NOT NULL DEFAULT '',
  ADD COLUMN "riskRatingOverridden"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "riskScore"               INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "verifiedAt"              TIMESTAMP(3),
  ADD COLUMN "verifiedById"            TEXT;

-- The generated wording is required. Existing rows have not been edited yet, so
-- their current text is by definition still the system's draft.
ALTER TABLE "gaps"
  ADD COLUMN "generatedDescription"    TEXT NOT NULL DEFAULT '',
  ADD COLUMN "generatedRecommendation" TEXT NOT NULL DEFAULT '';

UPDATE "gaps"
SET "generatedDescription" = "description",
    "generatedRecommendation" = "recommendation";

ALTER TABLE "gaps"
  ALTER COLUMN "generatedDescription" DROP DEFAULT,
  ALTER COLUMN "generatedRecommendation" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "gaps" ADD CONSTRAINT "gaps_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
