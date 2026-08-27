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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
