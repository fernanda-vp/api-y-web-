"use client";

import type { Company, Zone } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "../../../../lib/permission-labels";
import { CompanyPicker } from "../../_components/company-picker";
import { PaginationControls } from "../../_components/pagination-controls";
import { SearchBox } from "../../_components/search-box";
import { StatusPill } from "../../_components/status-pill";
import { ZoneFormModal } from "./zone-form-modal";
import { ZoneRowMenu } from "./zone-row-menu";

interface Props {
  companies: Company[];
  companyId?: number;
  zones: Zone[];
  page: number;
  totalPages: number;
  total: number;
  permissions: string[];
}

export function ZonesTable({ companies, companyId, zones, page, totalPages, total, permissions }: Props) {
  const [modal, setModal] = useState<null | { zone?: Zone }>(null);
  const canCreate = hasPermission(permissions, "zones:create");

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Zonas</h1>
          <p className="text-sm text-neutral-700">{total} zonas registradas</p>
        </div>

        <div className="flex items-center gap-2">
          <CompanyPicker companies={companies} selectedCompanyId={companyId} />
          <SearchBox placeholder="Buscar por nombre" />
          {canCreate && (
            <button
              type="button"
              disabled={!companyId}
              onClick={() => companyId && setModal({})}
              className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-100 bg-primary-50 text-[11px] font-semibold uppercase tracking-wider text-primary-900">
              <th className="px-4 py-3 text-left">Zona</th>
              <th className="px-4 py-3 text-left">Domicilio</th>
              <th className="px-4 py-3 text-left">Estatus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-t border-neutral-200 hover:bg-neutral-100/60">
                <td className="px-4 py-2.5 font-medium text-neutral-900">{zone.name}</td>
                <td className="px-4 py-2.5 text-neutral-700">{zone.address}</td>
                <td className="px-4 py-2.5">
                  <StatusPill isActive={zone.status.isActive} description={zone.status.description} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ZoneRowMenu zone={zone} permissions={permissions} onEdit={() => setModal({ zone })} />
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">
                  No hay zonas que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <PaginationControls page={page} totalPages={totalPages} />
      </div>

      {modal && companyId && (
        <ZoneFormModal companyId={companyId} zone={modal.zone} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
