"use client";

import type { Company } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { setCompanyStatus } from "../../../../actions/companies";

interface Props {
  company: Company;
  onEdit: () => void;
}

export function CompanyRowMenu({ company, onEdit }: Props) {
  const isActive = company.status.isActive;

  async function handleToggleStatus() {
    try {
      await setCompanyStatus(company.id, isActive ? "disable" : "enable");
      toast.success(isActive ? "Empresa deshabilitada" : "Empresa habilitada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estatus.");
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
          className="z-30 w-40 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg data-[state=open]:animate-[scale-in_120ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
          >
            Editar
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => void handleToggleStatus()}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
          >
            {isActive ? "Deshabilitar" : "Habilitar"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
