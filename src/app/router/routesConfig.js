import { Home, Search, BarChart3, Users } from 'lucide-react';

export const appRoutes = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor'],
  },
  {
    key: 'donors',
    label: 'Donor Search',
    path: '/donors',
    icon: Search,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor'],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader'],
  },
  {
    key: 'community',
    label: 'Community',
    path: '/community',
    icon: Users,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor'],
  },
];
