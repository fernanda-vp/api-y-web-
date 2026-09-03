"use server";

import { createJobTitleSchema, updateJobTitleSchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface JobTitleFormState {
  error?: string;
  success?: boolean;
}

export async function createJobTitleAction(
  _prevState: JobTitleFormState | undefined,
  formData: FormData,
): Promise<JobTitleFormState> {
  const rawParentId = formData.get("parentJobTitleId");

  const parsed = createJobTitleSchema.safeParse({
    name: formData.get("name"),
    parentJobTitleId:
      typeof rawParentId === "string" && rawParentId.length > 0 ? Number(rawParentId) : undefined,
  });

  if (!parsed.success) {
    return { error: "El nombre es requerido." };
  }

  try {
    await getApiClient().jobTitles.create(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/puestos");
  return { success: true };
}

export async function updateJobTitleAction(
  id: number,
  _prevState: JobTitleFormState | undefined,
  formData: FormData,
): Promise<JobTitleFormState> {
  const rawName = formData.get("name");
  const rawParentId = formData.get("parentJobTitleId");

  const parsed = updateJobTitleSchema.safeParse({
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : undefined,
    parentJobTitleId:
      typeof rawParentId === "string" ? (rawParentId.length > 0 ? Number(rawParentId) : null) : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  try {
    await getApiClient().jobTitles.update(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/puestos");
  return { success: true };
}

export async function setJobTitleStatus(id: number, nextStatus: "enable" | "disable") {
  const client = getApiClient();
  try {
    if (nextStatus === "enable") {
      await client.jobTitles.enable(id);
    } else {
      await client.jobTitles.disable(id);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/puestos");
}
