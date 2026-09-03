import type { Company, Department, Employee, JobTitle, Position, Zone } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { PositionsTable } from "./_components/positions-table";

const PAGE_SIZE = 10;
const SELECT_OPTIONS_LIMIT = 100;

interface Loaded {
  positions: Position[];
  page: number;
  totalPages: number;
  total: number;
  companies: Company[];
  departments: Department[];
  zones: Zone[];
  jobTitles: JobTitle[];
  employees: Employee[];
}

export default async function PlazasPage(props: PageProps<"/configuracion/plazas">) {
  const searchParams = await props.searchParams;
  const client = getApiClient();
  const me = await getCurrentUser();

  const page = searchParams.page ? Number(searchParams.page) : 1;

  let result: Loaded | { forbidden: true };
  try {
    const [positionsPage, companies, departmentsPage, zonesPage, jobTitlesPage, employeesPage] = await Promise.all([
      client.positions.list({ page, limit: PAGE_SIZE }),
      client.companies.list(),
      client.departments.list({ limit: SELECT_OPTIONS_LIMIT }),
      client.zones.list({ limit: SELECT_OPTIONS_LIMIT }),
      client.jobTitles.list({ limit: SELECT_OPTIONS_LIMIT }),
      client.employees.list({ limit: SELECT_OPTIONS_LIMIT }),
    ]);

    result = {
      positions: positionsPage.data,
      page: positionsPage.meta.page,
      totalPages: positionsPage.meta.totalPages,
      total: positionsPage.meta.total,
      companies,
      departments: departmentsPage.data,
      zones: zonesPage.data,
      jobTitles: jobTitlesPage.data,
      employees: employeesPage.data,
    };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <PositionsTable
      positions={result.positions}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
      companies={result.companies}
      departments={result.departments}
      zones={result.zones}
      jobTitles={result.jobTitles}
      employees={result.employees}
      permissions={me.permissions}
    />
  );
}
