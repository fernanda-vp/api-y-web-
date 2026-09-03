import type { Company, Department, Employee, JobTitle, Role, Zone } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { AssignmentsAdmin } from "./_components/assignments-admin";

interface Loaded {
  employees: Employee[];
  roles: Role[];
  companies: Company[];
  zones: Zone[];
  departments: Department[];
  jobTitles: JobTitle[];
}

export default async function AsignacionesPage() {
  const client = getApiClient();
  const me = await getCurrentUser();

  let result: Loaded | { forbidden: true };
  try {
    const [employeesPage, roles, companies, zonesPage, departmentsPage, jobTitlesPage] = await Promise.all([
      client.employees.list({ limit: 100 }),
      client.roles.list(),
      client.companies.list(),
      client.zones.list({ limit: 100 }),
      client.departments.list({ limit: 100 }),
      client.jobTitles.list({ limit: 100 }),
    ]);

    result = {
      employees: employeesPage.data,
      roles,
      companies,
      zones: zonesPage.data,
      departments: departmentsPage.data,
      jobTitles: jobTitlesPage.data,
    };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-bold text-neutral-900">Asignación de roles</h1>
      <p className="mb-4 text-sm text-neutral-700">
        Asigna un rol a un empleado con su alcance correspondiente (Global, Empresa, Zona, Departamento o Puesto).
      </p>
      <AssignmentsAdmin
        employees={result.employees}
        roles={result.roles}
        companies={result.companies}
        zones={result.zones}
        departments={result.departments}
        jobTitles={result.jobTitles}
        permissions={me.permissions}
      />
    </div>
  );
}
