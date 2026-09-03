"use client";

import type { JobTitle, JobTitleTreeNode } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "../../../../lib/permission-labels";
import { JobTitleFormModal } from "./job-title-form-modal";
import { JobTitleNode } from "./job-title-node";

interface Props {
  tree: JobTitleTreeNode[];
  permissions: string[];
}

export function JobTitlesTree({ tree, permissions }: Props) {
  const [modal, setModal] = useState<null | { jobTitle?: JobTitle; defaultParentId?: number }>(null);
  const canCreate = hasPermission(permissions, "job-titles:create");

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Puestos</h1>
          <p className="text-sm text-neutral-700">{tree.length} puestos raíz</p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setModal({})}
            className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={14} /> Agregar
          </button>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3">
        {tree.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">No hay puestos todavía.</p>
        ) : (
          tree.map((node) => (
            <JobTitleNode
              key={node.id}
              node={node}
              permissions={permissions}
              onEdit={(jobTitle) => setModal({ jobTitle })}
              onAddChild={(parentId) => setModal({ defaultParentId: parentId })}
            />
          ))
        )}
      </div>

      {modal && (
        <JobTitleFormModal
          tree={tree}
          jobTitle={modal.jobTitle}
          defaultParentId={modal.defaultParentId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
