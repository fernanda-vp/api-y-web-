"use client";

import type { MeResponse } from "@intranet/api-client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { logout } from "../../actions/auth";

function initialsOf(me: MeResponse) {
  return `${me.name.charAt(0)}${me.lastName.charAt(0)}`.toUpperCase();
}

export function UserMenu({ me }: { me: MeResponse }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
        >
          {initialsOf(me)}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-30 w-44 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-neutral-200 bg-white p-1 shadow-lg data-[state=open]:animate-[scale-in_120ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          <p className="truncate px-3 py-2 text-xs text-neutral-700">
            {me.name} {me.lastName}
          </p>
          <DropdownMenu.Item asChild>
            <Link
              href="/mi-perfil"
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              <UserRound size={14} /> Mi Perfil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-900 outline-none hover:bg-neutral-100 data-[highlighted]:bg-neutral-100"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
