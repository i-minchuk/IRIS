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

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await client.get('/api/v1/auth/users');
    return data;
  },

  updateUser: async (userId: number, payload: UserUpdatePayload): Promise<AdminUser> => {
    const { data } = await client.patch(`/api/v1/auth/users/${userId}`, payload);
    return data;
  },
};
