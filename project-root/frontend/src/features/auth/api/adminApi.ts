import client from '@/shared/api/client';

export interface AdminUser {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface UserUpdatePayload {
  email?: string;
  username?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  password?: string;
}

export interface CreateUserPayload {
  email: string;
  username?: string;
  full_name?: string;
  role?: string;
  password: string;
  is_active?: boolean;
}

export interface EmployeeProfile {
  user_id: number;
  position?: string;
  department?: string;
  phone?: string;
  hire_date?: string;
  skills?: string[];
  certifications?: string[];
  notes?: string;
}

export interface AIKeyStatus {
  openai_api_key: string;
  configured: boolean;
}

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await client.get('/auth/users');
    return data;
  },

  updateUser: async (userId: number, payload: UserUpdatePayload): Promise<AdminUser> => {
    const { data } = await client.patch(`/auth/users/${userId}`, payload);
    return data;
  },

  createUser: async (payload: CreateUserPayload): Promise<AdminUser> => {
    const { data } = await client.post('/auth/register', payload);
    return data;
  },

  getEmployeeProfile: async (userId: number): Promise<EmployeeProfile | null> => {
    try {
      const { data } = await client.get(`/employees/${userId}`);
      return data;
    } catch {
      return null;
    }
  },

  listEmployeeProfiles: async (): Promise<EmployeeProfile[]> => {
    const { data } = await client.get('/employees');
    return data;
  },

  updateEmployeeProfile: async (userId: number, payload: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
    const { data } = await client.put(`/employees/${userId}`, payload);
    return data;
  },

  getAIKey: async (): Promise<AIKeyStatus> => {
    const { data } = await client.get('/auth/admin/settings/ai-key');
    return data;
  },

  updateAIKey: async (openai_api_key: string): Promise<AIKeyStatus> => {
    const { data } = await client.post('/auth/admin/settings/ai-key', { openai_api_key });
    return data;
  },
};
