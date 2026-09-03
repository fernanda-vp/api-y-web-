"use server";

import { createEmployeeSchema, updateEmployeeSchema, updateMyProfileSchema } from "@intranet/api-client";
import { revalidatePath } from "next/cache";
import { getApiClient } from "../lib/api";
import { errorMessage } from "../lib/errors";

export interface EmployeeFormState {
  error?: string;
  success?: boolean;
  temporaryPassword?: string;
  username?: string;
}

export async function createEmployeeAction(
  _prevState: EmployeeFormState | undefined,
  formData: FormData,
): Promise<EmployeeFormState> {
  const rawPhone = formData.get("phone");
  const rawBio = formData.get("bio");
  const rawHireDate = formData.get("hireDate");
  const rawContractType = formData.get("contractType");
  const rawContractEndDate = formData.get("contractEndDate");

  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    lastName: formData.get("lastName"),
    code: formData.get("code"),
    phone: typeof rawPhone === "string" && rawPhone.length > 0 ? rawPhone : undefined,
    bio: typeof rawBio === "string" && rawBio.length > 0 ? rawBio : undefined,
    hireDate: typeof rawHireDate === "string" && rawHireDate.length > 0 ? rawHireDate : undefined,
    contractType:
      typeof rawContractType === "string" && rawContractType.length > 0 ? rawContractType : undefined,
    contractEndDate:
      typeof rawContractEndDate === "string" && rawContractEndDate.length > 0 ? rawContractEndDate : undefined,
  });

  if (!parsed.success) {
    return { error: "Nombre, apellido y código son requeridos." };
  }

  try {
    const result = await getApiClient().employees.create(parsed.data);
    revalidatePath("/configuracion/empleados");
    return {
      success: true,
      temporaryPassword: result.temporaryPassword,
      username: result.employee.user.username,
    };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function updateEmployeeAction(
  id: number,
  _prevState: EmployeeFormState | undefined,
  formData: FormData,
): Promise<EmployeeFormState> {
  const rawName = formData.get("name");
  const rawLastName = formData.get("lastName");
  const rawCode = formData.get("code");
  const rawPhone = formData.get("phone");
  const rawBio = formData.get("bio");
  const rawHireDate = formData.get("hireDate");
  const rawContractType = formData.get("contractType");
  const rawContractEndDate = formData.get("contractEndDate");

  const parsed = updateEmployeeSchema.safeParse({
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : undefined,
    lastName: typeof rawLastName === "string" && rawLastName.length > 0 ? rawLastName : undefined,
    code: typeof rawCode === "string" && rawCode.length > 0 ? rawCode : undefined,
    phone: typeof rawPhone === "string" && rawPhone.length > 0 ? rawPhone : undefined,
    bio: typeof rawBio === "string" && rawBio.length > 0 ? rawBio : undefined,
    hireDate: typeof rawHireDate === "string" && rawHireDate.length > 0 ? rawHireDate : undefined,
    contractType:
      typeof rawContractType === "string" && rawContractType.length > 0 ? rawContractType : undefined,
    contractEndDate:
      typeof rawContractEndDate === "string"
        ? rawContractEndDate.length > 0
          ? rawContractEndDate
          : null
        : undefined,
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del formulario." };
  }

  try {
    await getApiClient().employees.update(id, parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/configuracion/empleados");
  return { success: true };
}

export async function setEmployeeLifecycle(id: number, action: "activate" | "deactivate" | "terminate") {
  const client = getApiClient();
  try {
    await client.employees[action](id);
  } catch (err) {
    throw new Error(errorMessage(err));
  }
  revalidatePath("/configuracion/empleados");
}

export interface MyProfileFormState {
  error?: string;
  success?: boolean;
}

export async function updateMyProfileAction(
  _prevState: MyProfileFormState | undefined,
  formData: FormData,
): Promise<MyProfileFormState> {
  const rawPhotoUrl = formData.get("photoUrl");
  const rawPhone = formData.get("phone");
  const rawBio = formData.get("bio");

  // El formulario siempre viene precargado con el valor actual de cada campo
  // (ver MyProfileForm) — si llega vacío es porque el usuario lo borró a
  // propósito, así que se manda `null` explícito (borrar), no `undefined`
  // (no tocar), o el "borrado" se ignoraba en silencio mostrando éxito igual.
  const parsed = updateMyProfileSchema.safeParse({
    photoUrl: typeof rawPhotoUrl === "string" && rawPhotoUrl.length > 0 ? rawPhotoUrl : null,
    phone: typeof rawPhone === "string" && rawPhone.length > 0 ? rawPhone : null,
    bio: typeof rawBio === "string" && rawBio.length > 0 ? rawBio : null,
  });

  if (!parsed.success) {
    return { error: "La URL de la foto debe ser un link válido." };
  }

  try {
    await getApiClient().employees.updateMyProfile(parsed.data);
  } catch (err) {
    return { error: errorMessage(err) };
  }

  revalidatePath("/mi-perfil");
  return { success: true };
}
