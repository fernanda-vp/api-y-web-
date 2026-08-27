"use client";

import type { Company } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { CompanyFormModal } from "./company-form-modal";
import { CompanyRowMenu } from "./company-row-menu";

const PAGE_SIZE = 10;
const ROW_COLORS = ["bg-primary-200", "bg-accent-200", "bg-neutral-200"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % ROW_COLORS.length;
  }
  return ROW_COLORS[hash];
}

interface Props {
  companies: Company[];
}

export function CompaniesTable({ companies }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [modal, setModal] = useState<null | { company?: Company }>(null);

  const filtered = useMemo(
    () => companies.filter((company) => company.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = showAll
    ? filtered
    : filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Empresas</h1>
          <p className="text-sm text-neutral-700">{filtered.length} empresas registradas</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre"
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setModal({})}
            className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-100 bg-primary-50 text-[11px] font-semibold uppercase tracking-wider text-primary-900">
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">RFC</th>
              <th className="px-4 py-3 text-left">Estatus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((company) => (
              <tr key={company.id} className="border-t border-neutral-200 hover:bg-neutral-100/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold text-neutral-900 ${colorFor(
                        company.name,
                      )}`}
                    >
                      {initialsOf(company.name)}
                    </span>
                    {company.name}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-neutral-700">{company.rfc}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      company.status.isActive
                        ? "bg-success/10 text-success"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {company.status.description}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <CompanyRowMenu company={company} onEdit={() => setModal({ company })} />
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">
                  No hay empresas que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-neutral-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-md px-2 py-1 disabled:opacity-40"
          >
            ←
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-md px-2 py-1 disabled:opacity-40"
          >
            →
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(event) => setShowAll(event.target.checked)}
          />
          Mostrar todos
        </label>
      </div>

      {modal && <CompanyFormModal company={modal.company} onClose={() => setModal(null)} />}
    </div>
  );
}
