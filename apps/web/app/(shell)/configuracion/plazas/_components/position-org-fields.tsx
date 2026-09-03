"use client";

import type { Company, Department, JobTitle, Zone } from "@intranet/api-client";
import { useState } from "react";

interface Props {
  companies: Company[];
  departments: Department[];
  zones: Zone[];
  jobTitles: JobTitle[];
  defaultDepartmentId?: number;
  defaultZoneId?: number;
  defaultJobTitleId?: number;
  defaultManagerPositionId?: number;
  defaultFunctionalManagerPositionId?: number;
}

const SELECT_CLASS =
  "w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function PositionOrgFields({
  companies,
  departments,
  zones,
  jobTitles,
  defaultDepartmentId,
  defaultZoneId,
  defaultJobTitleId,
  defaultManagerPositionId,
  defaultFunctionalManagerPositionId,
}: Props) {
  const initialCompanyId =
    departments.find((department) => department.id === defaultDepartmentId)?.companyId ?? companies[0]?.id;
  const [companyId, setCompanyId] = useState<number | undefined>(initialCompanyId);

  const filteredDepartments = departments.filter((department) => department.companyId === companyId);
  const filteredZones = zones.filter((zone) => zone.companyId === companyId);

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="companyFilter">
          Empresa
        </label>
        <select
          id="companyFilter"
          value={companyId ?? ""}
          onChange={(event) => setCompanyId(Number(event.target.value))}
          className={SELECT_CLASS}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-400">Solo filtra las opciones de departamento/zona de abajo.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="jobTitleId">
          Puesto
        </label>
        <select id="jobTitleId" name="jobTitleId" defaultValue={defaultJobTitleId ?? ""} required className={SELECT_CLASS}>
          <option value="" disabled>
            Selecciona…
          </option>
          {jobTitles.map((jobTitle) => (
            <option key={jobTitle.id} value={jobTitle.id}>
              {jobTitle.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="departmentId">
          Departamento
        </label>
        <select
          key={`dept-${companyId}`}
          id="departmentId"
          name="departmentId"
          defaultValue={defaultDepartmentId ?? ""}
          required
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {filteredDepartments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="zoneId">
          Zona
        </label>
        <select
          key={`zone-${companyId}`}
          id="zoneId"
          name="zoneId"
          defaultValue={defaultZoneId ?? ""}
          required
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {filteredZones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="managerPositionId">
          Jefe directo — ID de posición (opcional)
        </label>
        <input
          id="managerPositionId"
          name="managerPositionId"
          type="number"
          defaultValue={defaultManagerPositionId ?? ""}
          className={SELECT_CLASS}
        />
        <p className="mt-1 text-xs text-neutral-400">
          Déjalo vacío para que se derive automáticamente del organigrama.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-900" htmlFor="functionalManagerPositionId">
          Jefe funcional — ID de posición (opcional)
        </label>
        <input
          id="functionalManagerPositionId"
          name="functionalManagerPositionId"
          type="number"
          defaultValue={defaultFunctionalManagerPositionId ?? ""}
          className={SELECT_CLASS}
        />
        <p className="mt-1 text-xs text-neutral-400">Independiente del jefe directo — nunca se deriva automáticamente.</p>
      </div>
    </>
  );
}
