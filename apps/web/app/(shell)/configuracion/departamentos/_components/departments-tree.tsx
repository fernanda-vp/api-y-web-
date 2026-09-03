"use client";

import type { Company, Department, DepartmentTreeNode } from "@intranet/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { hasPermission } from "../../../../lib/permission-labels";
import { CompanyPicker } from "../../_components/company-picker";
import { DepartmentFormModal } from "./department-form-modal";
import { DepartmentNode } from "./department-node";

interface Props {
  companies: Company[];
  companyId?: number;
  tree: DepartmentTreeNode[];
  permissions: string[];
}

export function DepartmentsTree({ companies, companyId, tree, permissions }: Props) {
  const [modal, setModal] = useState<null | { department?: Department; defaultParentId?: number }>(null);
  const canCreate = hasPermission(permissions, "departments:create");

  return (
    <div className="p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Departamentos</h1>
          <p className="text-sm text-neutral-700">{tree.length} departamentos raíz</p>
        </div>

        <div className="flex items-center gap-2">
          <CompanyPicker companies={companies} selectedCompanyId={companyId} />
          {canCreate && (
            <button
              type="button"
              disabled={!companyId}
              onClick={() => companyId && setModal({})}
              className="flex items-center gap-1.5 rounded-md bg-accent-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-3">
        {tree.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-neutral-400">No hay departamentos todavía.</p>
        ) : (
          tree.map((node) => (
            <DepartmentNode
              key={node.id}
              node={node}
              permissions={permissions}
              onEdit={(department) => setModal({ department })}
              onAddChild={(parentId) => setModal({ defaultParentId: parentId })}
            />
          ))
        )}
      </div>

      {modal && companyId && (
        <DepartmentFormModal
          companyId={companyId}
          tree={tree}
          department={modal.department}
          defaultParentId={modal.defaultParentId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
