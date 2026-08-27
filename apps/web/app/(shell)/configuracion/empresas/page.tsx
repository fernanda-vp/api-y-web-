import { getApiClient } from "../../../lib/api";
import { CompaniesTable } from "./_components/companies-table";

export default async function EmpresasPage() {
  const companies = await getApiClient().companies.list();
  return <CompaniesTable companies={companies} />;
}
