"use client";

import type { Employee } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { setEmployeeLifecycle } from "../../../../actions/employees";
import { hasPermission } from "../../../../lib/permission-labels";

interface Props {
  employee: Employee;
  permissions: string[];
  onEdit: () => void;
}

const LIFECYCLE_LABELS = {
  activate: "Activar",
  deactivate: "Desactivar",
  terminate: "Dar de baja",
} as const;

const ACTION_CURRENT_STATUS: Record<keyof typeof LIFECYCLE_LABELS, string> = {
  activate: "ACTIVE",
  deactivate: "INACTIVE",
  terminate: "TERMINATED",
};

const ACTION_PERMISSIONS: Record<keyof typeof LIFECYCLE_LABELS, string> = {
  activate: "employees:activate",
  deactivate: "employees:deactivate",
  terminate: "employees:terminate",
};

export function EmployeeRowMenu({ employee, permissions, onEdit }: Props) {
  const statusCode = employee.status.code;
  const canUpdate = hasPermission(permissions, "employees:update");

  async function handleLifecycle(action: "activate" | "deactivate" | "terminate") {
    try {
      await setEmployeeLifecycle(employee.id, action);
      toast.success(`Empleado: ${LIFECYCLE_LABELS[action].toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estatus.");
    }
  }

  const availableActions = (["activate", "deactivate", "terminate"] as const).filter(
    (action) => ACTION_CURRENT_STATUS[action] !== statusCode && hasPermission(permissions, ACTION_PERMISSIONS[action]),
  );

  if (!canUpdate && availableActions.length === 0) {
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
          className="z-30 w-44 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg data-[state=open]:animate-[scale-in_120ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          {canUpdate && (
            <DropdownMenu.Item
              onSelect={onEdit}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Editar
            </DropdownMenu.Item>
          )}
          {availableActions.map((action) => (
            <DropdownMenu.Item
              key={action}
              onSelect={() => void handleLifecycle(action)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              {LIFECYCLE_LABELS[action]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
