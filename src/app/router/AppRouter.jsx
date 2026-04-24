import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute } from './GuestRoute.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppShell } from '../../components/layout/AppShell.jsx';

const CommunityPage = lazy(() => import('../../features/community/pages/CommunityPage.jsx').then((m) => ({ default: m.CommunityPage })));
const HomePage = lazy(() => import('../../features/home/pages/HomePage.jsx').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })));
const DonorProfilePage = lazy(() => import('../../features/donors/pages/DonorProfilePage.jsx').then((m) => ({ default: m.DonorProfilePage })));
const DonorSearchPage = lazy(() => import('../../features/donors/pages/DonorSearchPage.jsx').then((m) => ({ default: m.DonorSearchPage })));
const ChatPage = lazy(() => import('../../features/chat/pages/ChatPage.jsx').then((m) => ({ default: m.ChatPage })));
const HospitalManagementPage = lazy(() => import('../../features/hospitals/pages/HospitalManagementPage.jsx').then((m) => ({ default: m.HospitalManagementPage })));
const RoleManagementPage = lazy(() => import('../../features/management/pages/RoleManagementPage.jsx').then((m) => ({ default: m.RoleManagementPage })));
const PatientListPage = lazy(() => import('../../features/patients/pages/PatientListPage.jsx').then((m) => ({ default: m.PatientListPage })));
const PatientDetailsPage = lazy(() => import('../../features/patients/pages/PatientDetailsPage.jsx'));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage })));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage.jsx').then((m) => ({ default: m.ReportsPage })));

const Loader = () => <div className="page-loader">পাতা লোড হচ্ছে...</div>;

const wrap = (Component) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route element={<AppShell />}>
        <Route path="/home" element={wrap(HomePage)} />
        <Route path="/patients" element={wrap(PatientListPage)} />
        <Route path="/patients/:id" element={wrap(PatientDetailsPage)} />
      </Route>

      <Route
        path="/login"
        element={
          <GuestRoute>
            {wrap(LoginPage)}
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            {wrap(RegisterPage)}
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={wrap(DashboardPage)} />
        <Route
          path="/donors"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
              {wrap(DonorSearchPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
              {wrap(RoleManagementPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospitals"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin']}>
              {wrap(HospitalManagementPage)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder']}>
              {wrap(ChatPage)}
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={wrap(ProfilePage)} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
              {wrap(ReportsPage)}
            </ProtectedRoute>
          }
        />
        <Route path="/community" element={wrap(CommunityPage)} />
      </Route>

      <Route
        path="/donors/:donorId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
            {wrap(DonorProfilePage)}
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
