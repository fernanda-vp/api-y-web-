"use client";

import type { DepartmentTreeNode } from "@intranet/api-client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { StatusPill } from "../../_components/status-pill";
import { DepartmentRowMenu } from "./department-row-menu";

interface Props {
  node: DepartmentTreeNode;
  permissions: string[];
  onEdit: (department: DepartmentTreeNode) => void;
  onAddChild: (parentId: number) => void;
}

export function DepartmentNode({ node, permissions, onEdit, onAddChild }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-100">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={`flex h-5 w-5 items-center justify-center text-neutral-400 ${hasChildren ? "" : "invisible"}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className="flex-1 text-sm font-medium text-neutral-900">{node.name}</span>
        <StatusPill isActive={node.status.isActive} description={node.status.description} />
        <DepartmentRowMenu
          department={node}
          permissions={permissions}
          onEdit={() => onEdit(node)}
          onAddChild={() => onAddChild(node.id)}
        />
      </div>

      {expanded && hasChildren && (
        <div className="ml-6 border-l border-neutral-200 pl-2">
          {node.children.map((child) => (
            <DepartmentNode
              key={child.id}
              node={child}
              permissions={permissions}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
