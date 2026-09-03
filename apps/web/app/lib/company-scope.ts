import type { Company } from "@intranet/api-client";

/** Resolves which company a page scoped by `?companyId=` should use: the
 * requested one if valid, otherwise the first company available. */
export function resolveCompanyId(companies: Company[], requested?: string): number | undefined {
  const parsed = requested ? Number(requested) : undefined;
  if (parsed && companies.some((company) => company.id === parsed)) {
    return parsed;
  }
  return companies[0]?.id;
}
