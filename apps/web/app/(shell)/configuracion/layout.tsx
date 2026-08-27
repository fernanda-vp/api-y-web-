import type { ReactNode } from "react";
import { SidebarNav } from "./_components/sidebar-nav";

export default function ConfiguracionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <SidebarNav />
      <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>
      {/* Panel derecho (notificaciones / próximos eventos): se agrega como
          columna adicional cuando exista un módulo real que lo alimente
          (ver specs/0007-web-shell-companies-list/spec.md). */}
    </div>
  );
}
