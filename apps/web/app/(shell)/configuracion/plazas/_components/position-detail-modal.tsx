"use client";

import type { PositionWithManagerResolution } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { getPositionDetail } from "../../../../actions/positions";
import { formatDate } from "../../../../lib/format";

interface Props {
  positionId: number;
  onClose: () => void;
}

function managerLabel(detail: PositionWithManagerResolution): string {
  const { managerResolution } = detail;
  switch (managerResolution.source) {
    case "explicit":
      return managerResolution.position
        ? `Asignado manualmente: ${managerResolution.position.employee.user.name} ${managerResolution.position.employee.user.lastName}`
        : "Asignado manualmente";
    case "derived":
      return managerResolution.position
        ? `Derivado automáticamente: ${managerResolution.position.employee.user.name} ${managerResolution.position.employee.user.lastName}`
        : "Derivado automáticamente";
    case "ambiguous":
      return `Ambiguo — ${managerResolution.candidates?.length ?? 0} candidatos ocupan el puesto padre, se debe elegir manualmente.`;
    case "none":
      return "Sin jefe (tope de la jerarquía o el puesto padre está vacante).";
  }
}

export function PositionDetailModal({ positionId, onClose }: Props) {
  const [detail, setDetail] = useState<PositionWithManagerResolution | null>(null);

  useEffect(() => {
    let active = true;
    void getPositionDetail(positionId).then((result) => {
      if (active) {
        setDetail(result);
      }
    });
    return () => {
      active = false;
    };
  }, [positionId]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg outline-none">
          <Dialog.Title className="mb-4 text-lg font-bold text-primary-900">Detalle de la posición</Dialog.Title>

          {!detail ? (
            <p className="text-sm text-neutral-400">Cargando…</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-neutral-500">Empleado: </span>
                <span className="font-medium text-neutral-900">
                  {detail.employee.user.name} {detail.employee.user.lastName}
                </span>
              </p>
              <p>
                <span className="text-neutral-500">Puesto: </span>
                {detail.jobTitle.name}
              </p>
              <p>
                <span className="text-neutral-500">Departamento: </span>
                {detail.department.name}
              </p>
              <p>
                <span className="text-neutral-500">Zona: </span>
                {detail.zone.name}
              </p>
              <p>
                <span className="text-neutral-500">Desde: </span>
                {formatDate(new Date(detail.startDate))}
                {detail.endDate ? ` — hasta ${formatDate(new Date(detail.endDate))}` : ""}
              </p>
              <div className="mt-3 rounded-md bg-neutral-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Jefe directo</p>
                <p className="mt-1 text-neutral-900">{managerLabel(detail)}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Cerrar
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
