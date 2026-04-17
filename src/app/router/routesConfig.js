import { Home, Search, BarChart3, Users, UserCircle2, ClipboardList, MessageCircle, UserCog } from 'lucide-react';

export const appRoutes = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'donors',
    label: 'Donor Directory',
    path: '/donors',
    icon: Search,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'patients',
    label: 'Patient List',
    path: '/patients',
    icon: ClipboardList,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'chat',
    label: 'Chat',
    path: '/chat',
    icon: MessageCircle,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: UserCircle2,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'],
  },
  {
    key: 'users',
    label: 'User Management',
    path: '/users',
    icon: UserCog,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'],
  },
  {
    key: 'community',
    label: 'Community',
    path: '/community',
    icon: Users,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
];
