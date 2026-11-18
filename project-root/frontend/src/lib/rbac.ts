import type { AdminRoleCode, AdminResource, AdminAction, Permission, AdminRole } from '@/types/admin';

export const SYSTEM_ROLES: AdminRole[] = [
  {
    code: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всему функционалу системы',
    color: '#8B5CF6',
    icon: 'crown',
    permissions: [
      { resource: 'users', action: 'manage' },
      { resource: 'roles', action: 'manage' },
      { resource: 'permissions', action: 'manage' },
      { resource: 'audit', action: 'read' },
      { resource: 'releases', action: 'manage' },
      { resource: 'tickets', action: 'manage' },
      { resource: 'incidents', action: 'manage' },
      { resource: 'kb', action: 'manage' },
      { resource: 'documents', action: 'approve' },
      { resource: 'projects', action: 'manage' },
      { resource: 'srm', action: 'manage' },
      { resource: 'gamification', action: 'manage' },
      { resource: 'system', action: 'manage' },
    ],
  },
];

export function can(roleCode: AdminRoleCode, action: AdminAction, resource: AdminResource): boolean {
  const role = SYSTEM_ROLES.find(r => r.code === roleCode);
  if (!role) return false;
  if (role.code === 'admin') return true;
  return role.permissions.some(
    p => p.resource === resource && (p.action === 'manage' || p.action === action)
  );
}

export function getRole(roleCode: AdminRoleCode): AdminRole | undefined {
  return SYSTEM_ROLES.find(r => r.code === roleCode);
}

export function getRolePermissions(roleCode: AdminRoleCode): Permission[] {
  return getRole(roleCode)?.permissions ?? [];
}
