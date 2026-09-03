"use server";

import { createPositionSchema, transferPositionSchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface PositionFormState {
  error?: string;
  success?: boolean;
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  return typeof value === "string" && value.length > 0 ? Number(value) : undefined;
}

export async function createPositionAction(
  _prevState: PositionFormState | undefined,
  formData: FormData,
): Promise<PositionFormState> {
  const parsed = createPositionSchema.safeParse({
    employeeId: Number(formData.get("employeeId")),
    jobTitleId: Number(formData.get("jobTitleId")),
    departmentId: Number(formData.get("departmentId")),
    zoneId: Number(formData.get("zoneId")),
    managerPositionId: optionalNumber(formData.get("managerPositionId")),
    functionalManagerPositionId: optionalNumber(formData.get("functionalManagerPositionId")),
  });

  if (!parsed.success) {
    return { error: "Empleado, puesto, departamento y zona son requeridos." };
  }

  try {
    await getApiClient().positions.create(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/plazas");
  return { success: true };
}

export async function transferPositionAction(
  id: number,
  _prevState: PositionFormState | undefined,
  formData: FormData,
): Promise<PositionFormState> {
  const parsed = transferPositionSchema.safeParse({
    jobTitleId: Number(formData.get("jobTitleId")),
    departmentId: Number(formData.get("departmentId")),
    zoneId: Number(formData.get("zoneId")),
    managerPositionId: optionalNumber(formData.get("managerPositionId")),
    functionalManagerPositionId: optionalNumber(formData.get("functionalManagerPositionId")),
  });

  if (!parsed.success) {
    return { error: "Puesto, departamento y zona son requeridos." };
  }

  try {
    await getApiClient().positions.transfer(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/plazas");
  return { success: true };
}

export async function endPositionAction(id: number) {
  try {
    await getApiClient().positions.end(id);
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/plazas");
}

export async function getPositionDetail(id: number) {
  return getApiClient().positions.get(id);
}
