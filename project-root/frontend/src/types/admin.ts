export type AdminRoleCode = 'product_owner' | 'system_admin' | 'tech_support' | 'content_editor' | 'admin';

export type AdminResource =
  | 'users' | 'roles' | 'permissions' | 'audit' | 'releases'
  | 'tickets' | 'incidents' | 'kb' | 'documents' | 'projects'
  | 'srm' | 'gamification' | 'system';

export type AdminAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve';

export interface Permission {
  resource: AdminResource;
  action: AdminAction;
}

export interface AdminRole {
  code: AdminRoleCode;
  name: string;
  description: string;
  permissions: Permission[];
  color: string;
  icon: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: AdminRoleCode;
  is_active: boolean;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
  avatar_url?: string;
}
