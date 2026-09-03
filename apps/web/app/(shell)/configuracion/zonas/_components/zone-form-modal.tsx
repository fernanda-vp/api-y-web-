"use client";

import type { Zone } from "@intranet/api-client";
import * as Dialog from "@radix-ui/react-dialog";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createZoneAction, updateZoneAction, type ZoneFormState } from "../../../../actions/zones";

interface Props {
  companyId: number;
  zone?: Zone;
  onClose: () => void;
}

const INITIAL_STATE: ZoneFormState = {};

export function ZoneFormModal({ companyId, zone, onClose }: Props) {
  const action = zone ? updateZoneAction.bind(null, zone.id) : createZoneAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const successMessage = zone ? "Zona actualizada" : "Zona creada";

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
            {zone ? "Editar zona" : "Nueva zona"}
          </Dialog.Title>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                defaultValue={zone?.name}
                required={!zone}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="address">
                Domicilio
              </label>
              <input
                id="address"
                name="address"
                defaultValue={zone?.address}
                required={!zone}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
