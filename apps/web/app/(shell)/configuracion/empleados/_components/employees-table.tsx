"use client";

import type { Employee } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PaginationControls } from "../../_components/pagination-controls";
import { SearchBox } from "../../_components/search-box";
import { StatusPill } from "../../_components/status-pill";
import { CONTRACT_TYPE_LABELS, formatTenure } from "../../../../lib/format";
import { hasPermission } from "../../../../lib/permission-labels";
import { EmployeeFormModal } from "./employee-form-modal";
import { EmployeeRowMenu } from "./employee-row-menu";

function initialsOf(name: string, lastName: string) {
  return ((name[0] ?? "") + (lastName[0] ?? "")).toUpperCase();
}

interface Props {
  employees: Employee[];
  page: number;
  totalPages: number;
  total: number;
  permissions: string[];
}

export function EmployeesTable({ employees, page, totalPages, total, permissions }: Props) {
  const [modal, setModal] = useState<null | { employee?: Employee }>(null);
  const canCreate = hasPermission(permissions, "employees:create");

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Empleados</h1>
          <p className="text-sm text-neutral-700">{total} empleados registrados</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBox placeholder="Buscar por nombre o clave" />
          {canCreate && (
            <button
              type="button"
              onClick={() => setModal({})}
              className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white"
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
              <th className="px-4 py-3 text-left">Empleado</th>
              <th className="px-4 py-3 text-left">Clave</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Contrato</th>
              <th className="px-4 py-3 text-left">Estatus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-neutral-200 hover:bg-neutral-100/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-200 text-xs font-semibold text-neutral-900">
                      {initialsOf(employee.user.name, employee.user.lastName)}
                    </span>
                    <div>
                      <div className="font-medium text-neutral-900">
                        {employee.user.name} {employee.user.lastName}
                      </div>
                      <div className="text-xs text-neutral-400">@{employee.user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-neutral-700">{employee.code}</td>
                <td className="px-4 py-2.5 text-neutral-700">{employee.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="text-neutral-900">{CONTRACT_TYPE_LABELS[employee.contractType]}</div>
                  <div className="text-xs text-neutral-400">{formatTenure(employee.hireDate)} de antigüedad</div>
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill isActive={employee.status.isActive} description={employee.status.description} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <EmployeeRowMenu
                    employee={employee}
                    permissions={permissions}
                    onEdit={() => setModal({ employee })}
                  />
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-400">
                  No hay empleados que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <PaginationControls page={page} totalPages={totalPages} />
      </div>

      {modal && <EmployeeFormModal employee={modal.employee} onClose={() => setModal(null)} />}
    </div>
  );
}
