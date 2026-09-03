"use client";

import type { Department, DepartmentTreeNode } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createDepartmentAction, updateDepartmentAction, type DepartmentFormState } from "../../../../actions/departments";
import { flattenTree, getDescendantIds } from "../../../../lib/tree";

interface Props {
  companyId: number;
  tree: DepartmentTreeNode[];
  department?: Department;
  defaultParentId?: number;
  onClose: () => void;
}

const INITIAL_STATE: DepartmentFormState = {};

export function DepartmentFormModal({ companyId, tree, department, defaultParentId, onClose }: Props) {
  const action = department
    ? updateDepartmentAction.bind(null, department.id)
    : createDepartmentAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const successMessage = department ? "Departamento actualizado" : "Departamento creado";

  useEffect(() => {
    if (state.success) {
      toast.success(successMessage);
      onClose();
    }
  }, [state.success, successMessage, onClose]);

  // Excluye el propio nodo y todos sus descendientes — reparentar un
  // departamento bajo su propio hijo/nieto crearía un ciclo; el backend ya lo
  // rechaza, pero no tiene sentido ofrecerlo como opción.
  const excludedIds = department ? getDescendantIds(tree, department.id) : new Set<number>();
  const parentOptions = flattenTree(tree).filter((item) => !excludedIds.has(item.id));

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30 data-[state=open]:animate-[fade-in_150ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]">
          <Dialog.Title className="mb-4 text-lg font-bold text-primary-900">
            {department ? "Editar departamento" : "Nuevo departamento"}
          </Dialog.Title>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                defaultValue={department?.name}
                required={!department}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="parentDepartmentId">
                Departamento padre
              </label>
              <select
                id="parentDepartmentId"
                name="parentDepartmentId"
                defaultValue={department?.parentDepartmentId ?? defaultParentId ?? ""}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">— Sin padre (raíz) —</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {"—".repeat(option.depth)} {option.name}
                  </option>
                ))}
              </select>
            </div>

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
