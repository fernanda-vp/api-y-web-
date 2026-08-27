import { Building2, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Header: un item por cada módulo de contenido real. Al agregar Noticias,
// Micrositios, etc. (sprints futuros), solo se agrega un elemento aquí.
export const HEADER_NAV: NavItem[] = [{ label: "Configuración", href: "/configuracion", icon: Settings }];

// Sidebar de Configuración: un item por catálogo real. Departamentos, Zonas,
// Empleados, Puestos, Plazas, Roles, etc. se agregan aquí cuando existan.
export const CONFIG_SIDEBAR_NAV: NavItem[] = [
  { label: "Empresas", href: "/configuracion/empresas", icon: Building2 },
];
