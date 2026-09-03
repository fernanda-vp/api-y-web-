import {
  Briefcase,
  Building2,
  IdCard,
  MapPin,
  Network,
  Settings,
  Shield,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Permiso mínimo para que el item tenga sentido mostrarse (típicamente el
  // `:read` del módulo). Sin este campo, el item siempre se muestra (ej.
  // Empresas, que todavía no está protegido por el motor de permisos).
  permission?: string;
}

// Header: un item por cada módulo de contenido real. Al agregar Noticias,
// Micrositios, etc. (sprints futuros), solo se agrega un elemento aquí.
export const HEADER_NAV: NavItem[] = [{ label: "Configuración", href: "/configuracion", icon: Settings }];

// Sidebar de Configuración: un item por catálogo real. Reportes, etc.
// se agregan aquí cuando existan.
export const CONFIG_SIDEBAR_NAV: NavItem[] = [
  { label: "Empresas", href: "/configuracion/empresas", icon: Building2 },
  { label: "Zonas", href: "/configuracion/zonas", icon: MapPin, permission: "zones:read" },
  { label: "Departamentos", href: "/configuracion/departamentos", icon: Network, permission: "departments:read" },
  { label: "Puestos", href: "/configuracion/puestos", icon: Briefcase, permission: "job-titles:read" },
  { label: "Empleados", href: "/configuracion/empleados", icon: Users, permission: "employees:read" },
  { label: "Plazas", href: "/configuracion/plazas", icon: IdCard, permission: "positions:read" },
  { label: "Roles", href: "/configuracion/roles", icon: Shield, permission: "roles:read" },
  { label: "Asignaciones", href: "/configuracion/asignaciones", icon: UserCog, permission: "roles:read" },
];
