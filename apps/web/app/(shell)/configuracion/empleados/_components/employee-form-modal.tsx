"use client";

import type { ContractType, Employee } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createEmployeeAction, updateEmployeeAction, type EmployeeFormState } from "../../../../actions/employees";
import { CONTRACT_TYPE_LABELS } from "../../../../lib/format";
import { DatePicker } from "../../_components/date-picker";

interface Props {
  employee?: Employee;
  onClose: () => void;
}

const INITIAL_STATE: EmployeeFormState = {};

function toDateInputValue(date?: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function EmployeeFormModal({ employee, onClose }: Props) {
  const action = employee ? updateEmployeeAction.bind(null, employee.id) : createEmployeeAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [contractType, setContractType] = useState<ContractType>(employee?.contractType ?? "INDEFINITE");

  useEffect(() => {
    if (state.success && !state.temporaryPassword) {
      toast.success("Empleado actualizado");
      onClose();
    }
  }, [state.success, state.temporaryPassword, onClose]);

  if (state.success && state.temporaryPassword) {
    return (
      <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg outline-none">
            <Dialog.Title className="mb-2 text-lg font-bold text-primary-900">Empleado creado</Dialog.Title>
            <p className="mb-3 text-sm text-neutral-700">
              Usuario: <span className="font-semibold text-neutral-900">{state.username}</span>
            </p>
            <p className="mb-2 text-sm text-neutral-700">
              Contraseña temporal — <strong>cópiala ahora</strong>, no se podrá volver a ver:
            </p>
            <code className="mb-4 block select-all rounded-md bg-neutral-100 p-3 text-center font-mono text-lg text-neutral-900">
              {state.temporaryPassword}
            </code>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Entendido, cerrar
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30 data-[state=open]:animate-[fade-in_150ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]">
          <Dialog.Title className="mb-4 text-lg font-bold text-primary-900">
            {employee ? "Editar empleado" : "Nuevo empleado"}
          </Dialog.Title>

          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="name">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  defaultValue={employee?.user.name}
                  required={!employee}
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="lastName">
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  defaultValue={employee?.user.lastName}
                  required={!employee}
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="code">
                Clave
              </label>
              <input
                id="code"
                name="code"
                defaultValue={employee?.code}
                required={!employee}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={employee?.phone ?? ""}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={employee?.bio ?? ""}
                rows={2}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="hireDate">
                  Fecha de contratación
                </label>
                <DatePicker
                  id="hireDate"
                  name="hireDate"
                  defaultValue={toDateInputValue(employee?.hireDate) || toDateInputValue(new Date())}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="contractType">
                  Tipo de contrato
                </label>
                <select
                  id="contractType"
                  name="contractType"
                  value={contractType}
                  onChange={(event) => setContractType(event.target.value as ContractType)}
                  className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="contractEndDate">
                Fecha fin de contrato {contractType !== "INDEFINITE" && "(opcional)"}
              </label>
              <DatePicker
                id="contractEndDate"
                name="contractEndDate"
                disabled={contractType === "INDEFINITE"}
                defaultValue={toDateInputValue(employee?.contractEndDate)}
              />
              {contractType === "INDEFINITE" && (
                <p className="mt-1 text-xs text-neutral-400">Un contrato indefinido no lleva fecha de fin.</p>
              )}
            </div>

            {!employee && (
              <p className="text-xs text-neutral-400">
                El usuario de acceso se genera automáticamente a partir del nombre.
              </p>
            )}

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
