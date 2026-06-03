import { create } from 'zustand';
import type { AdminUser, AdminRoleCode } from '@/types/admin';
import { can } from '@/lib/rbac';
import type { AdminResource, AdminAction } from '@/types/admin';

interface AdminState {
  users: AdminUser[];
  currentUserRole: AdminRoleCode | null;
  isLoading: boolean;
  error: string | null;

  setUsers: (users: AdminUser[]) => void;
  setCurrentUserRole: (role: AdminRoleCode) => void;
  hasPermission: (action: AdminAction, resource: AdminResource) => boolean;
  hasRole: (role: AdminRoleCode) => boolean;
  getUsersByRole: (role: AdminRoleCode) => AdminUser[];
  getActiveUsers: () => AdminUser[];
  getUsersWithMFA: () => AdminUser[];
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  currentUserRole: null,
  isLoading: false,
  error: null,

  setUsers: (users) => set({ users }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),

  hasPermission: (action, resource) => {
    const role = get().currentUserRole;
    if (!role) return false;
    return can(role, action, resource);
  },

  hasRole: (role) => get().currentUserRole === role,

  getUsersByRole: (role) => get().users.filter(u => u.role === role),
  getActiveUsers: () => get().users.filter(u => u.is_active),
  getUsersWithMFA: () => get().users.filter(u => u.mfa_enabled),
}));
