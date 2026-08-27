"use client";

import type { Company } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  createCompanyAction,
  updateCompanyAction,
  type CompanyFormState,
} from "../../../../actions/companies";

interface Props {
  company?: Company;
  onClose: () => void;
}

const INITIAL_STATE: CompanyFormState = {};

export function CompanyFormModal({ company, onClose }: Props) {
  const action = company ? updateCompanyAction.bind(null, company.id) : createCompanyAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const successMessage = company ? "Empresa actualizada" : "Empresa creada";

  useEffect(() => {
    if (state.success) {
      toast.success(successMessage);
      onClose();
    }
  }, [state.success, successMessage, onClose]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/30 data-[state=open]:animate-[fade-in_150ms_ease-out] data-[state=closed]:animate-[fade-out_100ms_ease-in]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]">
          <Dialog.Title className="mb-4 text-lg font-bold text-primary-900">
            {company ? "Editar empresa" : "Nueva empresa"}
          </Dialog.Title>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                defaultValue={company?.name}
                required={!company}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="rfc">
                RFC
              </label>
              <input
                id="rfc"
                name="rfc"
                defaultValue={company?.rfc}
                required={!company}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
              />
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
