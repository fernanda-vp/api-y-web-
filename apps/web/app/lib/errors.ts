import { isAxiosError } from "axios";

export function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}

/** Extrae el mensaje real del backend (validaciones, conflictos, dependencias
 * de permisos, etc.) en vez de esconderlo detrás de un texto genérico. */
export function errorMessage(err: unknown): string {
  if (isAxiosError(err) && typeof err.response?.data?.message === "string") {
    return err.response.data.message;
  }
  return "Ocurrió un error inesperado.";
}
