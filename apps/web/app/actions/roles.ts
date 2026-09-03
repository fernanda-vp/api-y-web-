"use server";

import type { ScopeType } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export async function toggleRolePermission(roleId: number, permissionId: number, grant: boolean) {
  const client = getApiClient();
  try {
    if (grant) {
      await client.roles.grantPermission(roleId, permissionId);
    } else {
      await client.roles.revokePermission(roleId, permissionId);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/roles");
}

export async function bulkSetRolePermissions(roleId: number, permissionIds: number[], grant: boolean) {
  try {
    await getApiClient().roles.bulkSetPermissions(roleId, permissionIds, grant);
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/roles");
}

export interface RoleFormState {
  error?: string;
  success?: boolean;
}

export async function createRoleAction(
  _prevState: RoleFormState | undefined,
  formData: FormData,
): Promise<RoleFormState> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "El nombre es requerido." };
  }

  try {
    await getApiClient().roles.create({ name: name.trim() });
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/roles");
  return { success: true };
}

export async function renameRoleAction(
  roleId: number,
  _prevState: RoleFormState | undefined,
  formData: FormData,
): Promise<RoleFormState> {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "El nombre es requerido." };
  }

  try {
    await getApiClient().roles.update(roleId, { name: name.trim() });
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/roles");
  return { success: true };
}

export async function setRoleStatus(roleId: number, enable: boolean) {
  const client = getApiClient();
  try {
    if (enable) {
      await client.roles.enable(roleId);
    } else {
      await client.roles.disable(roleId);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/roles");
}

export interface AssignmentFormState {
  error?: string;
  success?: boolean;
}

export async function createRoleAssignmentAction(
  _prevState: AssignmentFormState | undefined,
  formData: FormData,
): Promise<AssignmentFormState> {
  const userId = Number(formData.get("userId"));
  const roleId = Number(formData.get("roleId"));
  const scopeType = formData.get("scopeType") as ScopeType;
  const rawScopeId = formData.get("scopeId");
  const scopeId = typeof rawScopeId === "string" && rawScopeId.length > 0 ? Number(rawScopeId) : undefined;

  if (!userId || !roleId || !scopeType) {
    return { error: "Selecciona empleado, rol y alcance." };
  }

  try {
    await getApiClient().roleAssignments.create({ userId, roleId, scopeType, scopeId });
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/asignaciones");
  return { success: true };
}

export async function deleteRoleAssignmentAction(id: number) {
  try {
    await getApiClient().roleAssignments.remove(id);
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/asignaciones");
}

export async function getAssignmentsForUser(userId: number) {
  return getApiClient().roleAssignments.listByUser(userId);
}
