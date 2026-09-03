"use server";

import { createZoneSchema, updateZoneSchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface ZoneFormState {
  error?: string;
  success?: boolean;
}

export async function createZoneAction(
  companyId: number,
  _prevState: ZoneFormState | undefined,
  formData: FormData,
): Promise<ZoneFormState> {
  const parsed = createZoneSchema.safeParse({
    companyId,
    name: formData.get("name"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: "Nombre y dirección son requeridos." };
  }

  try {
    await getApiClient().zones.create(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/zonas");
  return { success: true };
}

export async function updateZoneAction(
  id: number,
  _prevState: ZoneFormState | undefined,
  formData: FormData,
): Promise<ZoneFormState> {
  const rawName = formData.get("name");
  const rawAddress = formData.get("address");

  const parsed = updateZoneSchema.safeParse({
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : undefined,
    address: typeof rawAddress === "string" && rawAddress.length > 0 ? rawAddress : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  try {
    await getApiClient().zones.update(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/zonas");
  return { success: true };
}

export async function setZoneStatus(id: number, nextStatus: "enable" | "disable") {
  const client = getApiClient();
  try {
    if (nextStatus === "enable") {
      await client.zones.enable(id);
    } else {
      await client.zones.disable(id);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/zonas");
}
