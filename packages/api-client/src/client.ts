import axios, { type AxiosInstance } from 'axios';
import {
  loginRequestSchema,
  loginResponseSchema,
  meResponseSchema,
  type LoginRequest,
} from './schemas/auth';
import {
  companyListSchema,
  companySchema,
  createCompanySchema,
  updateCompanySchema,
  type CompanyStatusFilter,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from './schemas/company';
import {
  departmentSchema,
  departmentTreeNodeSchema,
  departmentsPageSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentInput,
  type FindDepartmentsParams,
  type UpdateDepartmentInput,
} from './schemas/department';
import {
  createEmployeeResponseSchema,
  createEmployeeSchema,
  employeeSchema,
  employeesPageSchema,
  updateEmployeeSchema,
  updateMyProfileSchema,
  type CreateEmployeeInput,
  type FindEmployeesParams,
  type UpdateEmployeeInput,
  type UpdateMyProfileInput,
} from './schemas/employee';
import {
  createJobTitleSchema,
  jobTitleSchema,
  jobTitleTreeNodeSchema,
  jobTitlesPageSchema,
  updateJobTitleSchema,
  type CreateJobTitleInput,
  type FindJobTitlesParams,
  type UpdateJobTitleInput,
} from './schemas/job-title';
import {
  createPositionSchema,
  endPositionSchema,
  positionSchema,
  positionWithManagerResolutionSchema,
  positionsPageSchema,
  transferPositionSchema,
  updatePositionSchema,
  type CreatePositionInput,
  type EndPositionInput,
  type FindPositionsParams,
  type TransferPositionInput,
  type UpdatePositionInput,
} from './schemas/position';
import {
  createZoneSchema,
  updateZoneSchema,
  zoneSchema,
  zonesPageSchema,
  type CreateZoneInput,
  type FindZonesParams,
  type UpdateZoneInput,
} from './schemas/zone';
import {
  bulkSetPermissionsSchema,
  createRoleAssignmentSchema,
  createRoleSchema,
  grantPermissionSchema,
  permissionSchema,
  roleAssignmentSchema,
  roleSchema,
  updateRoleSchema,
  type CreateRoleAssignmentInput,
  type CreateRoleInput,
  type UpdateRoleInput,
} from './schemas/role';

export interface ApiClientConfig {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
}

export function createApiClient(config: ApiClientConfig) {
  const http: AxiosInstance = axios.create({ baseURL: config.baseURL });

  http.interceptors.request.use(async (requestConfig) => {
    const token = await config.getToken?.();
    if (token) {
      requestConfig.headers.set('Authorization', `Bearer ${token}`);
    }
    return requestConfig;
  });

  return {
    auth: {
      login: async (data: LoginRequest) => {
        const body = loginRequestSchema.parse(data);
        const res = await http.post('/auth/login', body);
        return loginResponseSchema.parse(res.data);
      },
      me: async () => {
        const res = await http.get('/auth/me');
        return meResponseSchema.parse(res.data);
      },
    },
    companies: {
      list: async (params?: { status?: CompanyStatusFilter }) => {
        const res = await http.get('/companies', { params });
        return companyListSchema.parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/companies/${id}`);
        return companySchema.parse(res.data);
      },
      create: async (data: CreateCompanyInput) => {
        const body = createCompanySchema.parse(data);
        const res = await http.post('/companies', body);
        return companySchema.parse(res.data);
      },
      update: async (id: number, data: UpdateCompanyInput) => {
        const body = updateCompanySchema.parse(data);
        const res = await http.patch(`/companies/${id}`, body);
        return companySchema.parse(res.data);
      },
      enable: async (id: number) => {
        const res = await http.patch(`/companies/${id}/enable`);
        return companySchema.parse(res.data);
      },
      disable: async (id: number) => {
        const res = await http.patch(`/companies/${id}/disable`);
        return companySchema.parse(res.data);
      },
    },
    zones: {
      list: async (params?: FindZonesParams) => {
        const res = await http.get('/zones', { params });
        return zonesPageSchema.parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/zones/${id}`);
        return zoneSchema.parse(res.data);
      },
      create: async (data: CreateZoneInput) => {
        const body = createZoneSchema.parse(data);
        const res = await http.post('/zones', body);
        return zoneSchema.parse(res.data);
      },
      update: async (id: number, data: UpdateZoneInput) => {
        const body = updateZoneSchema.parse(data);
        const res = await http.patch(`/zones/${id}`, body);
        return zoneSchema.parse(res.data);
      },
      enable: async (id: number) => {
        const res = await http.patch(`/zones/${id}/enable`);
        return zoneSchema.parse(res.data);
      },
      disable: async (id: number) => {
        const res = await http.patch(`/zones/${id}/disable`);
        return zoneSchema.parse(res.data);
      },
    },
    departments: {
      list: async (params?: FindDepartmentsParams) => {
        const res = await http.get('/departments', { params });
        return departmentsPageSchema.parse(res.data);
      },
      tree: async (companyId: number) => {
        const res = await http.get('/departments/tree', { params: { companyId } });
        return departmentTreeNodeSchema.array().parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/departments/${id}`);
        return departmentSchema.parse(res.data);
      },
      create: async (data: CreateDepartmentInput) => {
        const body = createDepartmentSchema.parse(data);
        const res = await http.post('/departments', body);
        return departmentSchema.parse(res.data);
      },
      update: async (id: number, data: UpdateDepartmentInput) => {
        const body = updateDepartmentSchema.parse(data);
        const res = await http.patch(`/departments/${id}`, body);
        return departmentSchema.parse(res.data);
      },
      enable: async (id: number) => {
        const res = await http.patch(`/departments/${id}/enable`);
        return departmentSchema.parse(res.data);
      },
      disable: async (id: number) => {
        const res = await http.patch(`/departments/${id}/disable`);
        return departmentSchema.parse(res.data);
      },
    },
    jobTitles: {
      list: async (params?: FindJobTitlesParams) => {
        const res = await http.get('/job-titles', { params });
        return jobTitlesPageSchema.parse(res.data);
      },
      tree: async () => {
        const res = await http.get('/job-titles/tree');
        return jobTitleTreeNodeSchema.array().parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/job-titles/${id}`);
        return jobTitleSchema.parse(res.data);
      },
      create: async (data: CreateJobTitleInput) => {
        const body = createJobTitleSchema.parse(data);
        const res = await http.post('/job-titles', body);
        return jobTitleSchema.parse(res.data);
      },
      update: async (id: number, data: UpdateJobTitleInput) => {
        const body = updateJobTitleSchema.parse(data);
        const res = await http.patch(`/job-titles/${id}`, body);
        return jobTitleSchema.parse(res.data);
      },
      enable: async (id: number) => {
        const res = await http.patch(`/job-titles/${id}/enable`);
        return jobTitleSchema.parse(res.data);
      },
      disable: async (id: number) => {
        const res = await http.patch(`/job-titles/${id}/disable`);
        return jobTitleSchema.parse(res.data);
      },
    },
    employees: {
      list: async (params?: FindEmployeesParams) => {
        const res = await http.get('/employees', { params });
        return employeesPageSchema.parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/employees/${id}`);
        return employeeSchema.parse(res.data);
      },
      create: async (data: CreateEmployeeInput) => {
        const body = createEmployeeSchema.parse(data);
        const res = await http.post('/employees', body);
        return createEmployeeResponseSchema.parse(res.data);
      },
      update: async (id: number, data: UpdateEmployeeInput) => {
        const body = updateEmployeeSchema.parse(data);
        const res = await http.patch(`/employees/${id}`, body);
        return employeeSchema.parse(res.data);
      },
      updateMyProfile: async (data: UpdateMyProfileInput) => {
        const body = updateMyProfileSchema.parse(data);
        const res = await http.patch('/employees/me', body);
        return employeeSchema.parse(res.data);
      },
      activate: async (id: number) => {
        const res = await http.patch(`/employees/${id}/activate`);
        return employeeSchema.parse(res.data);
      },
      deactivate: async (id: number) => {
        const res = await http.patch(`/employees/${id}/deactivate`);
        return employeeSchema.parse(res.data);
      },
      terminate: async (id: number) => {
        const res = await http.patch(`/employees/${id}/terminate`);
        return employeeSchema.parse(res.data);
      },
    },
    positions: {
      list: async (params?: FindPositionsParams) => {
        const res = await http.get('/positions', { params });
        return positionsPageSchema.parse(res.data);
      },
      get: async (id: number) => {
        const res = await http.get(`/positions/${id}`);
        return positionWithManagerResolutionSchema.parse(res.data);
      },
      create: async (data: CreatePositionInput) => {
        const body = createPositionSchema.parse(data);
        const res = await http.post('/positions', body);
        return positionSchema.parse(res.data);
      },
      update: async (id: number, data: UpdatePositionInput) => {
        const body = updatePositionSchema.parse(data);
        const res = await http.patch(`/positions/${id}`, body);
        return positionSchema.parse(res.data);
      },
      transfer: async (id: number, data: TransferPositionInput) => {
        const body = transferPositionSchema.parse(data);
        const res = await http.post(`/positions/${id}/transfer`, body);
        return positionSchema.parse(res.data);
      },
      end: async (id: number, data?: EndPositionInput) => {
        const body = endPositionSchema.parse(data ?? {});
        const res = await http.patch(`/positions/${id}/end`, body);
        return positionSchema.parse(res.data);
      },
    },
    roles: {
      list: async () => {
        const res = await http.get('/roles');
        return roleSchema.array().parse(res.data);
      },
      permissions: async () => {
        const res = await http.get('/permissions');
        return permissionSchema.array().parse(res.data);
      },
      create: async (data: CreateRoleInput) => {
        const body = createRoleSchema.parse(data);
        const res = await http.post('/roles', body);
        return roleSchema.parse(res.data);
      },
      update: async (id: number, data: UpdateRoleInput) => {
        const body = updateRoleSchema.parse(data);
        const res = await http.patch(`/roles/${id}`, body);
        return roleSchema.parse(res.data);
      },
      enable: async (id: number) => {
        const res = await http.patch(`/roles/${id}/enable`);
        return roleSchema.parse(res.data);
      },
      disable: async (id: number) => {
        const res = await http.patch(`/roles/${id}/disable`);
        return roleSchema.parse(res.data);
      },
      grantPermission: async (roleId: number, permissionId: number) => {
        const body = grantPermissionSchema.parse({ permissionId });
        const res = await http.post(`/roles/${roleId}/permissions`, body);
        return roleSchema.parse(res.data);
      },
      bulkSetPermissions: async (roleId: number, permissionIds: number[], grant: boolean) => {
        const body = bulkSetPermissionsSchema.parse({ permissionIds, grant });
        const res = await http.patch(`/roles/${roleId}/permissions/bulk`, body);
        return roleSchema.parse(res.data);
      },
      revokePermission: async (roleId: number, permissionId: number) => {
        const res = await http.delete(`/roles/${roleId}/permissions/${permissionId}`);
        return roleSchema.parse(res.data);
      },
    },
    roleAssignments: {
      listByUser: async (userId: number) => {
        const res = await http.get('/role-assignments', { params: { userId } });
        return roleAssignmentSchema.array().parse(res.data);
      },
      create: async (data: CreateRoleAssignmentInput) => {
        const body = createRoleAssignmentSchema.parse(data);
        const res = await http.post('/role-assignments', body);
        return roleAssignmentSchema.parse(res.data);
      },
      remove: async (id: number) => {
        await http.delete(`/role-assignments/${id}`);
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
