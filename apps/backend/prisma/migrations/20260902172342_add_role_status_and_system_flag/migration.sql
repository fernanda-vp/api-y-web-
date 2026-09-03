-- Ensure the ROLE status group + statuses exist (idempotent, matches
-- seed.ts's seedStatusGroup('ROLE', ...)) — needed so the backfill below
-- always has a target, independent of whether the seed script already ran.
INSERT INTO "StatusGroup" ("code", "description", "createdAt", "updatedAt")
VALUES ('ROLE', 'Role status', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Status" ("groupId", "code", "description", "isActive", "createdAt", "updatedAt")
SELECT g.id, v.code, v.description, v."isActive", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "StatusGroup" g
CROSS JOIN (VALUES
  ('ACTIVE', 'Active', true),
  ('INACTIVE', 'Inactive', false)
) AS v(code, description, "isActive")
WHERE g.code = 'ROLE'
ON CONFLICT ("groupId", "code") DO NOTHING;

-- AlterTable: add isSystem (safe default) and statusId as nullable first,
-- so existing rows aren't rejected before they're backfilled below.
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Role" ADD COLUMN "statusId" INTEGER;

-- Backfill existing rows (the 7 predefined roles seeded before this migration).
UPDATE "Role" r
SET "statusId" = (
  SELECT s.id FROM "Status" s
  JOIN "StatusGroup" g ON s."groupId" = g.id
  WHERE g.code = 'ROLE' AND s.code = 'ACTIVE'
  LIMIT 1
)
WHERE r."statusId" IS NULL;

UPDATE "Role" SET "isSystem" = true WHERE "name" IN (
  'Administrador General',
  'Administrador de Encuestas',
  'Administrador de Reportes',
  'Administrador de Mapa de Sistemas',
  'Administrador de Vacantes',
  'Administrador de Permisos',
  'Administrador de Carpetas/Foros'
);

-- Now enforce NOT NULL + the foreign key.
ALTER TABLE "Role" ALTER COLUMN "statusId" SET NOT NULL;
ALTER TABLE "Role" ADD CONSTRAINT "Role_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
