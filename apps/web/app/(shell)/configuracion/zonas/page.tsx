import type { Company, Zone } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { resolveCompanyId } from "../../../lib/company-scope";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { ZonesTable } from "./_components/zones-table";

const PAGE_SIZE = 10;

interface Loaded {
  companies: Company[];
  companyId: number | undefined;
  zones: Zone[];
  page: number;
  totalPages: number;
  total: number;
}

export default async function ZonasPage(props: PageProps<"/configuracion/zonas">) {
  const searchParams = await props.searchParams;
  const client = getApiClient();
  const me = await getCurrentUser();

  const page = searchParams.page ? Number(searchParams.page) : 1;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status = searchParams.status === "active" || searchParams.status === "inactive" ? searchParams.status : undefined;

  let result: Loaded | { forbidden: true };
  try {
    const companies = await client.companies.list();
    const companyId = resolveCompanyId(companies, searchParams.companyId as string | undefined);

    const zonesPage = companyId
      ? await client.zones.list({ page, limit: PAGE_SIZE, search, status, companyId })
      : { data: [], meta: { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 } };

    result = {
      companies,
      companyId,
      zones: zonesPage.data,
      page: zonesPage.meta.page,
      totalPages: zonesPage.meta.totalPages,
      total: zonesPage.meta.total,
    };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <ZonesTable
      companies={result.companies}
      companyId={result.companyId}
      zones={result.zones}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
      permissions={me.permissions}
    />
  );
}
