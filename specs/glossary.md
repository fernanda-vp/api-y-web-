# Glosario Español → Inglés

Referencia de nomenclatura para todas las tareas siguientes. El documento de contexto y las specs se redactan en español; todo identificador de código (modelos Prisma, tablas, campos, servicios, variables) va en inglés.

## Entidades

| Español (documento de contexto) | Inglés (código) | Notas |
|---|---|---|
| Empresa | `Company` | |
| Zona | `Zone` | |
| Departamento | `Department` | |
| Puesto | `JobTitle` | Catálogo jerárquico del cargo (ej. "Gerente", "Director") |
| Plaza | `Position` | Asignación concreta: empleado + puesto + departamento + zona + fechas |
| Empleado | `Employee` | Perfil de RRHH, relacionado 1:1 con `User` |
| (nuevo) | `User` | Identidad de acceso/login |
| (nuevo) | `UserCredential` | Password hash, separado de `User` |
| Rol | `Role` | |
| Permiso | `Permission` | |
| RolPermiso | `RolePermission` | Tabla puente |
| AsignacionRol | `RoleAssignment` | Referencia a `User`, no a `Employee` (control de acceso es de la identidad de login) |
| (nuevo) | `Status` | Catálogo de estatus |
| (nuevo) | `StatusGroup` | Agrupador de estatus (uno por entidad: `COMPANY`, `ZONE`, `DEPARTMENT`, `JOB_TITLE`, `USER`, `EMPLOYEE`, `POSITION`) |

## Campos comunes

| Español | Inglés |
|---|---|
| nombre | `name` |
| apellido | `lastName` |
| clave | `code` |
| usuario | `username` |
| fotoUrl | `photoUrl` |
| telefonoContacto | `phone` |
| domicilio | `address` |
| estado / estatusId | `statusId` |
| empresaId | `companyId` |
| zonaId | `zoneId` |
| departamentoId | `departmentId` |
| puestoId | `jobTitleId` |
| jefePlazaId | `managerPositionId` |
| jefeFuncionalPlazaId | `functionalManagerPositionId` |
| fechaInicio | `startDate` |
| fechaFin | `endDate` |
| fechaBaja | `terminationDate` |
| accion | `action` |
| codigo | `code` |
| descripcion | `description` |
| esActivo | `isActive` |

## Estructura de carpetas (impacto)

El documento de contexto usa `core/empresas` como ejemplo de módulo. Con esta convención, los módulos del backend se nombran en inglés: `core/companies`, `core/departments`, `core/positions`, etc.
