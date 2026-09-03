"use server";

import { createDepartmentSchema, updateDepartmentSchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface DepartmentFormState {
  error?: string;
  success?: boolean;
}

export async function createDepartmentAction(
  companyId: number,
  _prevState: DepartmentFormState | undefined,
  formData: FormData,
): Promise<DepartmentFormState> {
  const rawParentId = formData.get("parentDepartmentId");

  const parsed = createDepartmentSchema.safeParse({
    companyId,
    name: formData.get("name"),
    parentDepartmentId:
      typeof rawParentId === "string" && rawParentId.length > 0 ? Number(rawParentId) : undefined,
  });

  if (!parsed.success) {
    return { error: "El nombre es requerido." };
  }

  try {
    await getApiClient().departments.create(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/departamentos");
  return { success: true };
}

export async function updateDepartmentAction(
  id: number,
  _prevState: DepartmentFormState | undefined,
  formData: FormData,
): Promise<DepartmentFormState> {
  const rawName = formData.get("name");
  const rawParentId = formData.get("parentDepartmentId");

  const parsed = updateDepartmentSchema.safeParse({
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : undefined,
    parentDepartmentId:
      typeof rawParentId === "string" ? (rawParentId.length > 0 ? Number(rawParentId) : null) : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  try {
    await getApiClient().departments.update(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/departamentos");
  return { success: true };
}

export async function setDepartmentStatus(id: number, nextStatus: "enable" | "disable") {
  const client = getApiClient();
  try {
    if (nextStatus === "enable") {
      await client.departments.enable(id);
    } else {
      await client.departments.disable(id);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/departamentos");
}
