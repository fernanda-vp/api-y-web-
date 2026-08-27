"use server";

import { loginRequestSchema } from "@intranet/api-client";
import { redirect } from "next/navigation";
import { getAnonymousApiClient } from "../lib/api";
import { createSession, deleteSession } from "../lib/session";

export interface LoginFormState {
  error?: string;
}

export async function login(
  _prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginRequestSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Usuario y contraseña son requeridos." };
  }

  try {
    const { accessToken } = await getAnonymousApiClient().auth.login(parsed.data);
    await createSession(accessToken);
  } catch {
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect("/configuracion/empresas");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
