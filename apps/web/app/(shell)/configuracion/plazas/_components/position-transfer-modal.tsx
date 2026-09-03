"use client";

import type { Company, Department, Position, Zone, JobTitle } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { transferPositionAction, type PositionFormState } from "../../../../actions/positions";
import { PositionOrgFields } from "./position-org-fields";

interface Props {
  position: Position;
  companies: Company[];
  departments: Department[];
  zones: Zone[];
  jobTitles: JobTitle[];
  onClose: () => void;
}

const INITIAL_STATE: PositionFormState = {};

export function PositionTransferModal({ position, companies, departments, zones, jobTitles, onClose }: Props) {
  const action = transferPositionAction.bind(null, position.id);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      toast.success("Posición transferida");
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30 data-[state=open]:animate-[fade-in_150ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]">
          <Dialog.Title className="mb-1 text-lg font-bold text-primary-900">Transferir posición</Dialog.Title>
          <p className="mb-4 text-sm text-neutral-700">
            {position.employee.user.name} {position.employee.user.lastName} — se cierra la posición actual y se
            crea una nueva.
          </p>

          <form action={formAction} className="space-y-3">
            <PositionOrgFields
              companies={companies}
              departments={departments}
              zones={zones}
              jobTitles={jobTitles}
              defaultDepartmentId={position.departmentId}
              defaultZoneId={position.zoneId}
              defaultJobTitleId={position.jobTitleId}
              defaultManagerPositionId={position.managerPositionId ?? undefined}
              defaultFunctionalManagerPositionId={position.functionalManagerPositionId ?? undefined}
            />

            {state.error && <p className="text-sm text-error">{state.error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                disabled={pending}
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Transfiriendo…" : "Transferir"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
