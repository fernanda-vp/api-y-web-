"use client";

import { useActionState } from "react";
import { login } from "../actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-neutral-100 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-bold text-primary-900">Intranet Kenmeina</h1>
        <p className="mb-6 text-sm text-neutral-700">Inicia sesión con tu usuario.</p>

        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          className="mb-4 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-primary focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mb-2 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-primary focus:outline-none"
        />

        {state?.error && <p className="mb-4 text-sm text-error">{state.error}</p>}

        <button
          disabled={pending}
          type="submit"
          className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
