"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONFIG_SIDEBAR_NAV } from "../../../lib/nav";

const STORAGE_KEY = "config-sidebar-collapsed";

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Preferencia persistida solo existe en el navegador (localStorage no está
    // disponible durante el render en servidor) — se sincroniza una vez al montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed, hydrated]);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-neutral-200 bg-white py-4 transition-[width] duration-200 ${
        collapsed ? "w-14 px-1.5" : "w-[160px] px-2"
      }`}
    >
      <div className="mb-2 flex items-center px-1">
        {!collapsed && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Configuración
          </p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="ml-auto rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-primary"
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5">
        {CONFIG_SIDEBAR_NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-primary-50 font-semibold text-primary"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
