import { Home, Search, BarChart3, Users, UserCircle2, ClipboardList } from 'lucide-react';

export const appRoutes = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor', 'finder'],
  },
  {
    key: 'donors',
    label: 'Donor Directory',
    path: '/donors',
    icon: Search,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor', 'finder'],
  },
  {
    key: 'patients',
    label: 'Patient List',
    path: '/patients',
    icon: ClipboardList,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor', 'finder'],
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: UserCircle2,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor', 'finder'],
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
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'donor', 'finder'],
  },
];
