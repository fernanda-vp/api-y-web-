"use client";

import type { Permission, Role } from "@intranet/api-client";
import { Lock, Pencil, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import {
  bulkSetRolePermissions,
  createRoleAction,
  renameRoleAction,
  setRoleStatus,
  type RoleFormState,
} from "../../../../actions/roles";
import { ACTION_LABELS, hasPermission, permissionGroupOf, RESOURCE_LABELS } from "../../../../lib/permission-labels";
import { ConfirmDialog } from "../../../../../components/confirm-dialog";
import { StatusPill } from "../../_components/status-pill";

interface Props {
  roles: Role[];
  permissions: Permission[];
  userPermissions: string[];
}

interface PendingChange {
  role: Role;
  finalIds: number[];
  grant: boolean;
  extra: Permission[];
}

const INITIAL_STATE: RoleFormState = {};

function groupPermissions(permissions: Permission[]): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const group = permissionGroupOf(permission.action);
    const list = groups.get(group) ?? [];
    list.push(permission);
    groups.set(group, list);
  }
  return groups;
}

function describePermission(permission: Permission): string {
  const group = permissionGroupOf(permission.action);
  const [, action] = permission.action.split(":");
  return `${RESOURCE_LABELS[group] ?? group}: ${ACTION_LABELS[action] ?? action}`;
}

/** Permisos que faltarían otorgar si se otorgan `requestedIds` (no incluidos ya). */
function computeMissingDependencies(role: Role, permissions: Permission[], requestedIds: number[]): Permission[] {
  const byId = new Map(permissions.map((permission) => [permission.id, permission]));
  const grantedIds = new Set(role.rolePermissions.map((rp) => rp.permission.id));
  const finalIds = new Set([...grantedIds, ...requestedIds]);

  const missingIds = new Set<number>();
  for (const id of requestedIds) {
    for (const dependsOnId of byId.get(id)?.dependsOn ?? []) {
      if (!finalIds.has(dependsOnId)) missingIds.add(dependsOnId);
    }
  }
  return [...missingIds].map((id) => byId.get(id)).filter((p): p is Permission => p !== undefined);
}

/** Permisos ya otorgados que quedarían con una dependencia faltante si se quitan `requestedIds`. */
function computeBrokenDependents(role: Role, permissions: Permission[], requestedIds: number[]): Permission[] {
  const grantedIds = new Set(role.rolePermissions.map((rp) => rp.permission.id));
  const finalIds = new Set([...grantedIds].filter((id) => !requestedIds.includes(id)));
  return permissions.filter((p) => finalIds.has(p.id) && p.dependsOn.some((depId) => !finalIds.has(depId)));
}

export function RolesAdmin({ roles, permissions, userPermissions }: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id ?? null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const groups = groupPermissions(permissions);
  const canCreateRole = hasPermission(userPermissions, "roles:create");
  const canManagePermissions = hasPermission(userPermissions, "roles:manage-permissions");

  async function applyChange(role: Role, finalIds: number[], grant: boolean) {
    try {
      await bulkSetRolePermissions(role.id, finalIds, grant);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el permiso.");
    }
  }

  function handleRequestChange(role: Role, requestedIds: number[], grant: boolean) {
    if (grant) {
      const missing = computeMissingDependencies(role, permissions, requestedIds);
      if (missing.length > 0) {
        setPendingChange({
          role,
          grant: true,
          extra: missing,
          finalIds: [...new Set([...requestedIds, ...missing.map((p) => p.id)])],
        });
        return;
      }
    } else {
      const broken = computeBrokenDependents(role, permissions, requestedIds);
      if (broken.length > 0) {
        setPendingChange({
          role,
          grant: false,
          extra: broken,
          finalIds: [...new Set([...requestedIds, ...broken.map((p) => p.id)])],
        });
        return;
      }
    }

    void applyChange(role, requestedIds, grant);
  }

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6">
      <div className="h-fit rounded-xl border border-neutral-200 bg-white p-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
              role.id === selectedRoleId
                ? "bg-primary-50 font-semibold text-primary"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {role.name}
            <span className="ml-1 text-xs text-neutral-400">({role.rolePermissions.length})</span>
          </button>
        ))}
        {canCreateRole && <CreateRoleForm />}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        {!selectedRole ? (
          <p className="text-sm text-neutral-400">No hay roles.</p>
        ) : (
          <>
            <RoleHeader role={selectedRole} userPermissions={userPermissions} />
            <div className="space-y-4">
              {[...groups.entries()].map(([group, perms]) => (
                <PermissionGroup
                  key={group}
                  group={group}
                  perms={perms}
                  role={selectedRole}
                  canManage={canManagePermissions}
                  onToggle={(permissionId, grant) => handleRequestChange(selectedRole, [permissionId], grant)}
                  onBulkToggle={(permissionIds, grant) => handleRequestChange(selectedRole, permissionIds, grant)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingChange(null);
        }}
        title={pendingChange?.grant ? "Otorgar permisos adicionales" : "Quitar permisos dependientes"}
        description={
          pendingChange && (
            <>
              <p>Esto también {pendingChange.grant ? "otorgará" : "quitará"}:</p>
              <ul className="mt-1 list-disc pl-4">
                {pendingChange.extra.map((permission) => (
                  <li key={permission.id}>{describePermission(permission)}</li>
                ))}
              </ul>
            </>
          )
        }
        onConfirm={() => {
          if (pendingChange) void applyChange(pendingChange.role, pendingChange.finalIds, pendingChange.grant);
          setPendingChange(null);
        }}
      />
    </div>
  );
}

interface PermissionGroupProps {
  group: string;
  perms: Permission[];
  role: Role;
  canManage: boolean;
  onToggle: (permissionId: number, grant: boolean) => void;
  onBulkToggle: (permissionIds: number[], grant: boolean) => void;
}

function PermissionGroup({ group, perms, role, canManage, onToggle, onBulkToggle }: PermissionGroupProps) {
  const grantedCount = perms.filter((permission) =>
    role.rolePermissions.some((rp) => rp.permission.id === permission.id),
  ).length;
  const allGranted = grantedCount === perms.length;
  const noneGranted = grantedCount === 0;

  return (
    <div>
      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={allGranted}
          disabled={!canManage}
          ref={(el) => {
            if (el) el.indeterminate = !allGranted && !noneGranted;
          }}
          onChange={() =>
            onBulkToggle(
              perms.map((permission) => permission.id),
              !allGranted,
            )
          }
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {RESOURCE_LABELS[group] ?? group}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {perms.map((permission) => {
          const granted = role.rolePermissions.some((rp) => rp.permission.id === permission.id);
          const [, action] = permission.action.split(":");
          return (
            <label
              key={permission.id}
              className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900"
            >
              <input
                type="checkbox"
                checked={granted}
                disabled={!canManage}
                onChange={() => onToggle(permission.id, !granted)}
              />
              {ACTION_LABELS[action] ?? action}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CreateRoleForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createRoleAction, INITIAL_STATE);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm text-primary hover:bg-primary-50"
      >
        <Plus size={14} /> Crear rol
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-1 space-y-1.5 rounded-md border border-neutral-200 p-2">
      <input
        name="name"
        autoFocus
        placeholder="Nombre del rol"
        className="w-full rounded-md border border-neutral-200 px-2 py-1 text-sm focus:border-primary focus:outline-none"
      />
      {state.error && <p className="text-xs text-error">{state.error}</p>}
      <div className="flex gap-1.5">
        <button
          disabled={pending}
          type="submit"
          className="flex-1 rounded-md bg-accent-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RoleHeader({ role, userPermissions }: { role: Role; userPermissions: string[] }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(renameRoleAction.bind(null, role.id), INITIAL_STATE);
  const canUpdate = hasPermission(userPermissions, "roles:update");
  const canToggleStatus = hasPermission(userPermissions, role.status.isActive ? "roles:disable" : "roles:enable");

  async function handleToggleStatus() {
    try {
      await setRoleStatus(role.id, !role.status.isActive);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estatus del rol.");
    }
  }

  if (editing) {
    return (
      <form action={formAction} className="mb-4 flex items-center gap-2">
        <input
          name="name"
          defaultValue={role.name}
          autoFocus
          className="rounded-md border border-neutral-200 px-2 py-1 text-lg font-bold focus:border-primary focus:outline-none"
        />
        <button
          disabled={pending}
          type="submit"
          className="rounded-md bg-accent-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
        >
          Cancelar
        </button>
        {state.error && <p className="text-xs text-error">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-lg font-bold text-neutral-900">{role.name}</h2>
      <StatusPill isActive={role.status.isActive} description={role.status.description} />
      {role.isSystem ? (
        <span className="flex items-center gap-1 text-xs text-neutral-400">
          <Lock size={12} /> Rol del sistema
        </span>
      ) : (
        <>
          {canUpdate && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-neutral-400 hover:text-primary"
              aria-label="Renombrar rol"
            >
              <Pencil size={14} />
            </button>
          )}
          {canToggleStatus && (
            <button
              type="button"
              onClick={() => void handleToggleStatus()}
              className="ml-auto text-xs font-medium text-primary hover:underline"
            >
              {role.status.isActive ? "Deshabilitar" : "Habilitar"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
