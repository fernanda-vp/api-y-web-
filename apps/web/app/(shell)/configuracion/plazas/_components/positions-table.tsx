"use client";

import type { Company, Department, Employee, JobTitle, Position, Zone } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { formatDate } from "../../../../lib/format";
import { hasPermission } from "../../../../lib/permission-labels";
import { PaginationControls } from "../../_components/pagination-controls";
import { StatusPill } from "../../_components/status-pill";
import { PositionCreateModal } from "./position-create-modal";
import { PositionDetailModal } from "./position-detail-modal";
import { PositionRowMenu } from "./position-row-menu";
import { PositionTransferModal } from "./position-transfer-modal";

interface Props {
  positions: Position[];
  page: number;
  totalPages: number;
  total: number;
  companies: Company[];
  departments: Department[];
  zones: Zone[];
  jobTitles: JobTitle[];
  employees: Employee[];
  permissions: string[];
}

type Modal =
  | { kind: "create" }
  | { kind: "detail"; positionId: number }
  | { kind: "transfer"; position: Position };

export function PositionsTable({
  positions,
  page,
  totalPages,
  total,
  companies,
  departments,
  zones,
  jobTitles,
  employees,
  permissions,
}: Props) {
  const [modal, setModal] = useState<Modal | null>(null);
  const canCreate = hasPermission(permissions, "positions:create");

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Plazas</h1>
          <p className="text-sm text-neutral-700">{total} posiciones registradas</p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({ kind: "create" })}
            className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={14} /> Agregar
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-100 bg-primary-50 text-[11px] font-semibold uppercase tracking-wider text-primary-900">
              <th className="px-4 py-3 text-left">Empleado</th>
              <th className="px-4 py-3 text-left">Puesto</th>
              <th className="px-4 py-3 text-left">Departamento</th>
              <th className="px-4 py-3 text-left">Zona</th>
              <th className="px-4 py-3 text-left">Desde</th>
              <th className="px-4 py-3 text-left">Estatus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id} className="border-t border-neutral-200 hover:bg-neutral-100/60">
                <td className="px-4 py-2.5 font-medium text-neutral-900">
                  {position.employee.user.name} {position.employee.user.lastName}
                </td>
                <td className="px-4 py-2.5 text-neutral-700">{position.jobTitle.name}</td>
                <td className="px-4 py-2.5 text-neutral-700">{position.department.name}</td>
                <td className="px-4 py-2.5 text-neutral-700">{position.zone.name}</td>
                <td className="px-4 py-2.5 text-neutral-700">
                  {formatDate(new Date(position.startDate))}
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill isActive={position.status.isActive} description={position.status.description} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <PositionRowMenu
                    position={position}
                    permissions={permissions}
                    onViewDetail={() => setModal({ kind: "detail", positionId: position.id })}
                    onTransfer={() => setModal({ kind: "transfer", position })}
                  />
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-400">
                  No hay posiciones que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <PaginationControls page={page} totalPages={totalPages} />
      </div>

      {modal?.kind === "create" && (
        <PositionCreateModal
          companies={companies}
          departments={departments}
          zones={zones}
          jobTitles={jobTitles}
          employees={employees}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === "detail" && (
        <PositionDetailModal positionId={modal.positionId} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "transfer" && (
        <PositionTransferModal
          position={modal.position}
          companies={companies}
          departments={departments}
          zones={zones}
          jobTitles={jobTitles}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
