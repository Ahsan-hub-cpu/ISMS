-- Custom roles with editable permissions. Migrates the UserRole enum onto Role rows.

CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permission" VARCHAR(64) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permission")
);

CREATE INDEX "role_permissions_permission_idx" ON "role_permissions"("permission");

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stable ids so seed / re-runs can upsert by id as well as code.
INSERT INTO "roles" ("id", "code", "name", "description", "isSystem", "createdAt", "updatedAt") VALUES
  ('role-administrator', 'ADMINISTRATOR', 'Administrator', 'Manages users, roles, framework data and system configuration.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role-assessor', 'ASSESSOR', 'Assessor / Compliance Officer', 'Performs assessments, records findings and verifies closure.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role-control-owner', 'CONTROL_OWNER', 'Control Owner', 'Owns assigned controls and provides progress and evidence.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role-viewer', 'VIEWER', 'Viewer / Management', 'Reads dashboards and reports without changing assessment data.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Permission sets mirror the previous hard-coded matrix.
INSERT INTO "role_permissions" ("roleId", "permission")
SELECT 'role-administrator', p FROM (VALUES
  ('users:read'),('users:manage'),('organization:manage'),
  ('frameworks:read'),('frameworks:manage'),
  ('register:read'),('register:manage'),
  ('assessments:read'),('assessments:conduct'),('assessments:approve'),
  ('gaps:read'),('gaps:manage'),
  ('evidence:read'),('evidence:upload'),('evidence:review'),
  ('remediation:read'),('remediation:update'),('remediation:manage'),
  ('reports:read'),('audit:read')
) AS v(p);

INSERT INTO "role_permissions" ("roleId", "permission")
SELECT 'role-assessor', p FROM (VALUES
  ('frameworks:read'),('register:read'),('assessments:read'),('gaps:read'),
  ('evidence:read'),('remediation:read'),('reports:read'),
  ('users:read'),('register:manage'),
  ('assessments:conduct'),('assessments:approve'),
  ('gaps:manage'),('evidence:upload'),('evidence:review'),
  ('remediation:update'),('remediation:manage'),('audit:read')
) AS v(p);

INSERT INTO "role_permissions" ("roleId", "permission")
SELECT 'role-control-owner', p FROM (VALUES
  ('frameworks:read'),('register:read'),('assessments:read'),('gaps:read'),
  ('evidence:read'),('remediation:read'),('reports:read'),
  ('evidence:upload'),('remediation:update')
) AS v(p);

INSERT INTO "role_permissions" ("roleId", "permission")
SELECT 'role-viewer', p FROM (VALUES
  ('frameworks:read'),('register:read'),('assessments:read'),('gaps:read'),
  ('evidence:read'),('remediation:read'),('reports:read')
) AS v(p);

ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

UPDATE "users" u
SET "roleId" = CASE u."role"::text
  WHEN 'ADMINISTRATOR' THEN 'role-administrator'
  WHEN 'ASSESSOR' THEN 'role-assessor'
  WHEN 'CONTROL_OWNER' THEN 'role-control-owner'
  WHEN 'VIEWER' THEN 'role-viewer'
  ELSE 'role-viewer'
END;

ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_fkey";
DROP INDEX IF EXISTS "users_role_idx";

ALTER TABLE "users" DROP COLUMN "role";

DROP TYPE IF EXISTS "UserRole";

CREATE INDEX "users_roleId_idx" ON "users"("roleId");

ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
