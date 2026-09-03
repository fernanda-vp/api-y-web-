import type { Company, DepartmentTreeNode } from "@intranet/api-client";
import { getApiClient } from "../../../lib/api";
import { resolveCompanyId } from "../../../lib/company-scope";
import { isForbiddenError } from "../../../lib/errors";
import { getCurrentUser } from "../../../lib/permissions";
import { PermissionDenied } from "../_components/permission-denied";
import { DepartmentsTree } from "./_components/departments-tree";

interface Loaded {
  companies: Company[];
  companyId: number | undefined;
  tree: DepartmentTreeNode[];
}

export default async function DepartamentosPage(props: PageProps<"/configuracion/departamentos">) {
  const searchParams = await props.searchParams;
  const client = getApiClient();
  const me = await getCurrentUser();

  let result: Loaded | { forbidden: true };
  try {
    const companies = await client.companies.list();
    const companyId = resolveCompanyId(companies, searchParams.companyId as string | undefined);
    const tree = companyId ? await client.departments.tree(companyId) : [];
    result = { companies, companyId, tree };
  } catch (err) {
    if (!isForbiddenError(err)) throw err;
    result = { forbidden: true };
  }

  if ("forbidden" in result) return <PermissionDenied />;

  return (
    <DepartmentsTree
      companies={result.companies}
      companyId={result.companyId}
      tree={result.tree}
      permissions={me.permissions}
    />
  );
}
