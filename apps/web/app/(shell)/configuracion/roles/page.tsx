import type { Permission, Role } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { RolesAdmin } from "./_components/roles-admin";

interface Loaded {
  roles: Role[];
  permissions: Permission[];
}

export default async function RolesPage() {
  const client = getApiClient();
  const me = await getCurrentUser();

  let result: Loaded | { forbidden: true };
  try {
    const [roles, permissions] = await Promise.all([client.roles.list(), client.roles.permissions()]);
    result = { roles, permissions };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">Roles y permisos</h1>
      <p className="mb-4 text-sm text-neutral-700">
        {result.roles.length} roles · {result.permissions.length} permisos disponibles
      </p>
      <RolesAdmin roles={result.roles} permissions={result.permissions} userPermissions={me.permissions} />
    </div>
  );
}
