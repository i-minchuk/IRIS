import type { AdminRoleCode } from '@/types/admin';
import { getRole } from '@/lib/rbac';
import { Crown, Shield, Headphones, FileEdit, UserCog } from 'lucide-react';

const iconMap = {
  crown: Crown,
  shield: Shield,
  headphones: Headphones,
  'file-edit': FileEdit,
};

export function RoleBadge({ role, showIcon = true }: { role: AdminRoleCode; showIcon?: boolean }) {
  const roleDef = getRole(role);
  if (!roleDef) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {showIcon && <UserCog size={12} />}
        {role}
      </span>
    );
  }

  const Icon = iconMap[roleDef.icon as keyof typeof iconMap] || UserCog;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${roleDef.color}18`,
        color: roleDef.color,
        border: `1px solid ${roleDef.color}35`,
      }}
    >
      {showIcon && <Icon size={12} />}
      {roleDef.name}
    </span>
  );
}
