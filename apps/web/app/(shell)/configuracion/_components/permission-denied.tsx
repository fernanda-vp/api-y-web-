import { ShieldAlert } from "lucide-react";

export function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
      <ShieldAlert size={32} className="text-neutral-400" />
      <p className="text-sm font-medium text-neutral-900">No tienes permiso para ver esta sección.</p>
      <p className="text-xs text-neutral-400">
        Pide a un administrador que te asigne el rol correspondiente en Configuración → Asignaciones.
      </p>
    </div>
  );
}
