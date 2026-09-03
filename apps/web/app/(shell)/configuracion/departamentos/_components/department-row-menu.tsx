"use client";

import type { Department } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { setDepartmentStatus } from "../../../../actions/departments";
import { hasPermission } from "../../../../lib/permission-labels";

interface Props {
  department: Department;
  permissions: string[];
  onEdit: () => void;
  onAddChild: () => void;
}

export function DepartmentRowMenu({ department, permissions, onEdit, onAddChild }: Props) {
  const isActive = department.status.isActive;
  const canCreate = hasPermission(permissions, "departments:create");
  const canUpdate = hasPermission(permissions, "departments:update");
  const canToggleStatus = hasPermission(permissions, isActive ? "departments:disable" : "departments:enable");

  async function handleToggleStatus() {
    try {
      await setDepartmentStatus(department.id, isActive ? "disable" : "enable");
      toast.success(isActive ? "Departamento deshabilitado" : "Departamento habilitado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estatus.");
    }
  }

  if (!canCreate && !canUpdate && !canToggleStatus) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="rounded-md p-1 text-neutral-700 hover:bg-neutral-100"
          aria-label="Más acciones"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-30 w-48 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg data-[state=open]:animate-[scale-in_120ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          {canCreate && (
            <DropdownMenu.Item
              onSelect={onAddChild}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Agregar subdepartamento
            </DropdownMenu.Item>
          )}
          {canUpdate && (
            <DropdownMenu.Item
              onSelect={onEdit}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Editar / reparentar
            </DropdownMenu.Item>
          )}
          {canToggleStatus && (
            <DropdownMenu.Item
              onSelect={() => void handleToggleStatus()}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              {isActive ? "Deshabilitar" : "Habilitar"}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
