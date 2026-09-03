"use client";

import type { MeResponse } from "@intranet/api-client";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateMyProfileAction, type MyProfileFormState } from "../../../actions/employees";

interface Props {
  me: MeResponse;
}

const INITIAL_STATE: MyProfileFormState = {};

export function MyProfileForm({ me }: Props) {
  const [state, formAction, pending] = useActionState(updateMyProfileAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      toast.success("Perfil actualizado");
    }
  }, [state.success]);

  if (!me.employee) {
    return (
      <p className="text-sm text-neutral-700">
        Esta cuenta no tiene un perfil de empleado asociado (es una cuenta de sistema/administración).
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="photoUrl">
          URL de foto de perfil
        </label>
        <input
          id="photoUrl"
          name="photoUrl"
          defaultValue={me.photoUrl ?? ""}
          placeholder="https://…"
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
          defaultValue={me.employee.phone ?? ""}
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
          defaultValue={me.employee.bio ?? ""}
          rows={3}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <button
        disabled={pending}
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
