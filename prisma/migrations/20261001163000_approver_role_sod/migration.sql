-- Replace Viewer with Approver and tighten Assessor SoD (no assessment approve).

UPDATE "roles"
SET
  "code" = 'APPROVER',
  "name" = 'Approver',
  "description" = 'Approves submitted assessments and confirms gap closure. Does not record findings.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'VIEWER';

-- Assessor no longer approves assessments.
DELETE FROM "role_permissions"
WHERE "roleId" = 'role-assessor'
  AND "permission" = 'assessments:approve';

-- Refresh Approver permissions (role id may still be role-viewer after rename).
DELETE FROM "role_permissions"
WHERE "roleId" IN (
  SELECT "id" FROM "roles" WHERE "code" = 'APPROVER'
);

INSERT INTO "role_permissions" ("roleId", "permission")
SELECT r."id", p
FROM "roles" r
CROSS JOIN (
  VALUES
    ('frameworks:read'),
    ('register:read'),
    ('assessments:read'),
    ('assessments:approve'),
    ('gaps:read'),
    ('gaps:manage'),
    ('evidence:read'),
    ('evidence:review'),
    ('remediation:read'),
    ('reports:read'),
    ('audit:read')
) AS v(p)
WHERE r."code" = 'APPROVER';
