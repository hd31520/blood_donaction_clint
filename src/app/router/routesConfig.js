import { Home, Search, BarChart3, Users, UserCircle2, ClipboardList, MessageCircle, UserCog, Building2 } from 'lucide-react';

export const appRoutes = [
  {
    key: 'dashboard',
    label: 'ড্যাশবোর্ড',
    path: '/dashboard',
    icon: Home,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'donors',
    label: 'রক্তদাতা তালিকা',
    path: '/donors',
    icon: Search,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'],
  },
  {
    key: 'patients',
    label: 'রক্তের প্রয়োজন',
    path: '/patients',
    icon: ClipboardList,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'chat',
    label: 'চ্যাট',
    path: '/chat',
    icon: MessageCircle,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'profile',
    label: 'প্রোফাইল',
    path: '/profile',
    icon: UserCircle2,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
  {
    key: 'reports',
    label: 'রিপোর্ট',
    path: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'],
  },
  {
    key: 'hospitals',
    label: 'হাসপাতাল',
    path: '/hospitals',
    icon: Building2,
    roles: ['super_admin', 'district_admin', 'upazila_admin'],
  },
  {
    key: 'users',
    label: 'ইউজার ব্যবস্থাপনা',
    path: '/users',
    icon: UserCog,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'],
  },
  {
    key: 'community',
    label: 'কমিউনিটি',
    path: '/community',
    icon: Users,
    roles: ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder'],
  },
];
