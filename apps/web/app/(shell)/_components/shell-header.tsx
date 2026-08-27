import type { MeResponse } from "@intranet/api-client";
import { Bell, Search } from "lucide-react";
import { NavTabs } from "./nav-tabs";
import { UserMenu } from "./user-menu";

export function ShellHeader({ me }: { me: MeResponse }) {
  return (
    <header className="flex h-[52px] items-center gap-5 border-b border-neutral-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="h-[22px] w-[22px] rounded-md bg-primary" />
        <span className="text-[15px] font-medium text-neutral-900">Intranet Kenmeina</span>
      </div>

      <NavTabs />

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5">
          <Search size={14} className="text-neutral-400" />
          <input
            disabled
            placeholder="Buscar en la intranet"
            className="w-40 bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>
        <Bell size={18} className="text-neutral-700" />
        <UserMenu me={me} />
      </div>
    </header>
  );
}
