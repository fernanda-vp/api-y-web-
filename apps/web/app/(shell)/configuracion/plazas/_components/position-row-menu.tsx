"use client";

import type { Position } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { endPositionAction } from "../../../../actions/positions";
import { hasPermission } from "../../../../lib/permission-labels";

interface Props {
  position: Position;
  permissions: string[];
  onViewDetail: () => void;
  onTransfer: () => void;
}

export function PositionRowMenu({ position, permissions, onViewDetail, onTransfer }: Props) {
  const isActive = position.endDate === null;
  const canTransfer = isActive && hasPermission(permissions, "positions:transfer");
  const canEnd = isActive && hasPermission(permissions, "positions:end");

  async function handleEnd() {
    try {
      await endPositionAction(position.id);
      toast.success("Posición finalizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo finalizar la posición.");
    }
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
          <DropdownMenu.Item
            onSelect={onViewDetail}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
          >
            Ver detalle
          </DropdownMenu.Item>
          {canTransfer && (
            <DropdownMenu.Item
              onSelect={onTransfer}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Transferir
            </DropdownMenu.Item>
          )}
          {canEnd && (
            <DropdownMenu.Item
              onSelect={() => void handleEnd()}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              Finalizar
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
