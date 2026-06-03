import type { AdminRoleCode, AdminResource, AdminAction, Permission, AdminRole } from '@/types/admin';

export const SYSTEM_ROLES: AdminRole[] = [
  {
    code: 'product_owner',
    name: 'Product Owner',
    description: 'Полный доступ к системе',
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
  {
    code: 'system_admin',
    name: 'System Admin',
    description: 'Управление инфраструктурой и безопасностью',
    color: '#EF4444',
    icon: 'shield',
    permissions: [
      { resource: 'users', action: 'manage' },
      { resource: 'roles', action: 'read' },
      { resource: 'audit', action: 'read' },
      { resource: 'releases', action: 'manage' },
      { resource: 'tickets', action: 'manage' },
      { resource: 'incidents', action: 'manage' },
      { resource: 'kb', action: 'manage' },
      { resource: 'system', action: 'manage' },
    ],
  },
  {
    code: 'tech_support',
    name: 'Tech Support',
    description: 'Поддержка пользователей и решение инцидентов',
    color: '#3B82F6',
    icon: 'headphones',
    permissions: [
      { resource: 'users', action: 'read' },
      { resource: 'audit', action: 'read' },
      { resource: 'tickets', action: 'manage' },
      { resource: 'incidents', action: 'manage' },
      { resource: 'kb', action: 'manage' },
    ],
  },
  {
    code: 'content_editor',
    name: 'Content Editor',
    description: 'Управление документами и базой знаний',
    color: '#10B981',
    icon: 'file-edit',
    permissions: [
      { resource: 'documents', action: 'manage' },
      { resource: 'kb', action: 'manage' },
      { resource: 'projects', action: 'read' },
    ],
  },
];

export function can(roleCode: AdminRoleCode, action: AdminAction, resource: AdminResource): boolean {
  const role = SYSTEM_ROLES.find(r => r.code === roleCode);
  if (!role) return false;
  if (role.code === 'product_owner') return true;
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
