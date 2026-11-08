import type { UserRole } from '@/types';

export function homeRouteForRole(role: UserRole | undefined): string {
  if (role === 'ADMIN') return '/tabs/admin';
  return role === 'OWNER' ? '/tabs/owner' : '/tabs/home';
}
