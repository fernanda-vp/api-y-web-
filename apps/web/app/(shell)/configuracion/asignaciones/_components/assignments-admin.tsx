"use client";

import type {
  Company,
  Department,
  Employee,
  JobTitle,
  Role,
  RoleAssignment,
  ScopeType,
  Zone,
} from "@intranet/api-client";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createRoleAssignmentAction,
  deleteRoleAssignmentAction,
  getAssignmentsForUser,
  type AssignmentFormState,
} from "../../../../actions/roles";
import { hasPermission, SCOPE_TYPE_LABELS } from "../../../../lib/permission-labels";

interface Props {
  employees: Employee[];
  roles: Role[];
  companies: Company[];
  zones: Zone[];
  departments: Department[];
  jobTitles: JobTitle[];
  permissions: string[];
}

const INITIAL_STATE: AssignmentFormState = {};

export function AssignmentsAdmin({ employees, roles, companies, zones, departments, jobTitles, permissions }: Props) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(employees[0]?.id ?? null);
  const [scopeType, setScopeType] = useState<ScopeType>("GLOBAL");
  const [scopeCompanyId, setScopeCompanyId] = useState<number | undefined>(companies[0]?.id);
  const [assignments, setAssignments] = useState<RoleAssignment[] | null>(null);
  const [state, formAction, pending] = useActionState(createRoleAssignmentAction, INITIAL_STATE);
  const canAssign = hasPermission(permissions, "roles:assign");
  const canRevoke = hasPermission(permissions, "roles:revoke");

  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);

  useEffect(() => {
    if (!selectedEmployee) return;
    let active = true;
    // `state` (no solo `state.success`) fuerza recargar tras cada submit,
    // incluso si dos asignaciones seguidas terminan ambas en éxito.
    void getAssignmentsForUser(selectedEmployee.userId)
      .then((result) => {
        if (active) setAssignments(result);
      })
      .catch(() => {
        if (active) toast.error("No se pudieron cargar las asignaciones.");
      });
    return () => {
      active = false;
    };
  }, [selectedEmployee, state]);

  useEffect(() => {
    if (state.success) {
      toast.success("Rol asignado.");
    }
  }, [state]);

  async function handleRevoke(id: number) {
    try {
      await deleteRoleAssignmentAction(id);
      setAssignments((current) => current?.filter((a) => a.id !== id) ?? null);
      toast.success("Asignación revocada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo revocar.");
    }
  }

  function scopeOptions(): Array<{ id: number; label: string }> {
    switch (scopeType) {
      case "COMPANY":
        return companies.map((company) => ({ id: company.id, label: company.name }));
      case "ZONE":
        return zones
          .filter((zone) => zone.companyId === scopeCompanyId)
          .map((zone) => ({ id: zone.id, label: zone.name }));
      case "DEPARTMENT":
        return departments
          .filter((department) => department.companyId === scopeCompanyId)
          .map((department) => ({ id: department.id, label: department.name }));
      case "JOB_TITLE":
        return jobTitles.map((jobTitle) => ({ id: jobTitle.id, label: jobTitle.name }));
      default:
        return [];
    }
  }

  function findScopeName(assignment: RoleAssignment): string | undefined {
    switch (assignment.scopeType) {
      case "COMPANY":
        return companies.find((c) => c.id === assignment.scopeId)?.name;
      case "ZONE":
        return zones.find((z) => z.id === assignment.scopeId)?.name;
      case "DEPARTMENT":
        return departments.find((d) => d.id === assignment.scopeId)?.name;
      case "JOB_TITLE":
        return jobTitles.find((j) => j.id === assignment.scopeId)?.name;
      default:
        return undefined;
    }
  }

  function describeScope(assignment: RoleAssignment): string {
    const label = SCOPE_TYPE_LABELS[assignment.scopeType];
    if (assignment.scopeType === "GLOBAL") return label;
    const name = findScopeName(assignment);
    return name ? `${label}: ${name}` : `${label} #${assignment.scopeId}`;
  }

  return (
    <div className={canAssign ? "grid grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
      {canAssign && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Nueva asignación</h2>
          <form action={formAction} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="userId">
              Empleado
            </label>
            <select
              id="userId"
              name="userId"
              value={selectedEmployee?.userId ?? ""}
              onChange={(event) => {
                const employee = employees.find((e) => e.userId === Number(event.target.value));
                setSelectedEmployeeId(employee?.id ?? null);
              }}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.userId}>
                  {employee.user.name} {employee.user.lastName} (@{employee.user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="roleId">
              Rol
            </label>
            <select
              id="roleId"
              name="roleId"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="scopeType">
              Alcance
            </label>
            <select
              id="scopeType"
              name="scopeType"
              value={scopeType}
              onChange={(event) => setScopeType(event.target.value as ScopeType)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {Object.entries(SCOPE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(scopeType === "ZONE" || scopeType === "DEPARTMENT") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="scopeCompanyId">
                Empresa
              </label>
              <select
                id="scopeCompanyId"
                value={scopeCompanyId ?? ""}
                onChange={(event) => setScopeCompanyId(Number(event.target.value))}
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-400">Solo filtra las opciones de abajo.</p>
            </div>
          )}

          {scopeType !== "GLOBAL" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="scopeId">
                {SCOPE_TYPE_LABELS[scopeType]}
              </label>
              <select
                key={`scope-${scopeType}-${scopeCompanyId}`}
                id="scopeId"
                name="scopeId"
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {scopeOptions().map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {state.error && <p className="text-sm text-error">{state.error}</p>}

          <button
            disabled={pending}
            type="submit"
            className="rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Asignando…" : "Asignar rol"}
          </button>
        </form>
      </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Asignaciones{" "}
          {selectedEmployee ? `de ${selectedEmployee.user.name} ${selectedEmployee.user.lastName}` : ""}
        </h2>
        {assignments === null ? (
          <p className="text-sm text-neutral-400">Cargando…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-neutral-400">Sin asignaciones.</p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-neutral-900">
                    {assignment.role?.name ?? `Rol #${assignment.roleId}`}
                  </span>
                  <span className="text-neutral-400"> — {describeScope(assignment)}</span>
                </span>
                {canRevoke && (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(assignment.id)}
                    className="text-error hover:underline"
                  >
                    Revocar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
