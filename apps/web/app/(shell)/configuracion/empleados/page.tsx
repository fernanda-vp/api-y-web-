import type { Employee } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { EmployeesTable } from "./_components/employees-table";

const PAGE_SIZE = 10;

interface Loaded {
  employees: Employee[];
  page: number;
  totalPages: number;
  total: number;
}

export default async function EmpleadosPage(props: PageProps<"/configuracion/empleados">) {
  const searchParams = await props.searchParams;
  const client = getApiClient();
  const me = await getCurrentUser();

  const page = searchParams.page ? Number(searchParams.page) : 1;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const status =
    searchParams.status === "active" || searchParams.status === "inactive" || searchParams.status === "terminated"
      ? searchParams.status
      : undefined;

  let result: Loaded | { forbidden: true };
  try {
    const employeesPage = await client.employees.list({ page, limit: PAGE_SIZE, search, status });
    result = {
      employees: employeesPage.data,
      page: employeesPage.meta.page,
      totalPages: employeesPage.meta.totalPages,
      total: employeesPage.meta.total,
    };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <EmployeesTable
      employees={result.employees}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
      permissions={me.permissions}
    />
  );
}
