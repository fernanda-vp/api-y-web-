"use client";

import type { Company } from "@intranet/api-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  companies: Company[];
  selectedCompanyId: number | undefined;
}

export function CompanyPicker({ companies, selectedCompanyId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("companyId", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  if (companies.length === 0) {
    return <p className="text-sm text-neutral-400">No hay empresas registradas todavía.</p>;
  }

  return (
    <select
      value={selectedCompanyId ?? ""}
      onChange={(event) => handleChange(event.target.value)}
      className="rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
    >
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  );
}
