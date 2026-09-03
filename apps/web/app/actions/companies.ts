"use server";

import { createCompanySchema, updateCompanySchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface CompanyFormState {
  error?: string;
  success?: boolean;
}

export async function createCompanyAction(
  _prevState: CompanyFormState | undefined,
  formData: FormData,
): Promise<CompanyFormState> {
  const parsed = createCompanySchema.safeParse({
    name: formData.get("name"),
    rfc: formData.get("rfc"),
  });

  if (!parsed.success) {
    return { error: "Nombre y RFC son requeridos." };
  }

  try {
    await getApiClient().companies.create(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/empresas");
  return { success: true };
}

export async function updateCompanyAction(
  id: number,
  _prevState: CompanyFormState | undefined,
  formData: FormData,
): Promise<CompanyFormState> {
  const rawName = formData.get("name");
  const rawRfc = formData.get("rfc");

  const parsed = updateCompanySchema.safeParse({
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : undefined,
    rfc: typeof rawRfc === "string" && rawRfc.length > 0 ? rawRfc : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  try {
    await getApiClient().companies.update(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/empresas");
  return { success: true };
}

export async function setCompanyStatus(id: number, nextStatus: "enable" | "disable") {
  const client = getApiClient();
  try {
    if (nextStatus === "enable") {
      await client.companies.enable(id);
    } else {
      await client.companies.disable(id);
    }
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/empresas");
}
