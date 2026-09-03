/** Fecha corta con locale fijo — evita mismatches de hidratación, ya que
 * `toLocaleDateString()` sin locale explícito usa el idioma del entorno
 * (Node en el servidor vs. el navegador del cliente pueden diferir). */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  INDEFINITE: "Indefinido",
  FIXED_TERM: "Plazo fijo",
  PROJECT: "Por obra/proyecto",
  INTERN: "Practicante",
};

/** Antigüedad legible desde la fecha de contratación (nunca se reinicia por
 * transferencias de puesto — solo aplica a la relación laboral completa). */
export function formatTenure(hireDate: Date): string {
  const now = new Date();
  let years = now.getFullYear() - hireDate.getFullYear();
  let months = now.getMonth() - hireDate.getMonth();

  if (now.getDate() < hireDate.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return "Menos de 1 mes";
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} año${years === 1 ? "" : "s"}`);
  if (months > 0) parts.push(`${months} mes${months === 1 ? "" : "es"}`);
  return parts.join(", ");
}
