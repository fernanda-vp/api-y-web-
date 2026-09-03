"use client";

import type { Company, Department, Employee, JobTitle, Zone } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createPositionAction, type PositionFormState } from "../../../../actions/positions";
import { PositionOrgFields } from "./position-org-fields";

interface Props {
  companies: Company[];
  departments: Department[];
  zones: Zone[];
  jobTitles: JobTitle[];
  employees: Employee[];
  onClose: () => void;
}

const INITIAL_STATE: PositionFormState = {};

export function PositionCreateModal({ companies, departments, zones, jobTitles, employees, onClose }: Props) {
  const [state, formAction, pending] = useActionState(createPositionAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      toast.success("Posición creada");
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30 data-[state=open]:animate-[fade-in_150ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]">
          <Dialog.Title className="mb-4 text-lg font-bold text-primary-900">Nueva posición</Dialog.Title>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="employeeId">
                Empleado
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.user.name} {employee.user.lastName} ({employee.code})
                  </option>
                ))}
              </select>
            </div>

            <PositionOrgFields companies={companies} departments={departments} zones={zones} jobTitles={jobTitles} />

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
                {pending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
