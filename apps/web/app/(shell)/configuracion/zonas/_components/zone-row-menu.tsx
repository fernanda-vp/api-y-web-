"use client";

import type { Zone } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { setZoneStatus } from "../../../../actions/zones";
import { hasPermission } from "../../../../lib/permission-labels";

interface Props {
  zone: Zone;
  permissions: string[];
  onEdit: () => void;
}

export function ZoneRowMenu({ zone, permissions, onEdit }: Props) {
  const isActive = zone.status.isActive;
  const canUpdate = hasPermission(permissions, "zones:update");
  const canToggleStatus = hasPermission(permissions, isActive ? "zones:disable" : "zones:enable");

  async function handleToggleStatus() {
    try {
      await setZoneStatus(zone.id, isActive ? "disable" : "enable");
      toast.success(isActive ? "Zona deshabilitada" : "Zona habilitada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estatus.");
    }
  }

  if (!canUpdate && !canToggleStatus) {
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
          className="z-30 w-40 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg data-[state=open]:animate-[scale-in_120ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          {canUpdate && (
            <DropdownMenu.Item
              onSelect={onEdit}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Editar
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
