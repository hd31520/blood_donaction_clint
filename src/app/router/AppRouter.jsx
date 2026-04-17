import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute } from './GuestRoute.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppShell } from '../../components/layout/AppShell.jsx';

const CommunityPage = lazy(() => import('../../features/community/pages/CommunityPage.jsx').then((module) => ({ default: module.CommunityPage })));
const HomePage = lazy(() => import('../../features/home/pages/HomePage.jsx').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage.jsx').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })));
const DonorProfilePage = lazy(() => import('../../features/donors/pages/DonorProfilePage.jsx').then((module) => ({ default: module.DonorProfilePage })));
const DonorSearchPage = lazy(() => import('../../features/donors/pages/DonorSearchPage.jsx').then((module) => ({ default: module.DonorSearchPage })));
const ChatPage = lazy(() => import('../../features/chat/pages/ChatPage.jsx').then((module) => ({ default: module.ChatPage })));
const RoleManagementPage = lazy(() => import('../../features/management/pages/RoleManagementPage.jsx').then((module) => ({ default: module.RoleManagementPage })));
const PatientListPage = lazy(() => import('../../features/patients/pages/PatientListPage.jsx').then((module) => ({ default: module.PatientListPage })));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage.jsx').then((module) => ({ default: module.ProfilePage })));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage.jsx').then((module) => ({ default: module.ReportsPage })));

const RouteLoader = () => <div className="page-loader">Loading page...</div>;

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/donors/:donorId"
        element={
          <Suspense fallback={<RouteLoader />}>
            <DonorProfilePage />
          </Suspense>
        }
      />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Suspense fallback={<RouteLoader />}>
              <LoginPage />
            </Suspense>
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Suspense fallback={<RouteLoader />}>
              <RegisterPage />
            </Suspense>
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route
          path="home"
          element={
            <Suspense fallback={<RouteLoader />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<RouteLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="donors"
          element={
            <ProtectedRoute
              allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder']}
            >
              <Suspense fallback={<RouteLoader />}>
                <DonorSearchPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
              <Suspense fallback={<RouteLoader />}>
                <RoleManagementPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="chat"
          element={
            <ProtectedRoute
              allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder']}
            >
              <Suspense fallback={<RouteLoader />}>
                <ChatPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="patients"
          element={
            <ProtectedRoute
              allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin', 'donor', 'finder']}
            >
              <Suspense fallback={<RouteLoader />}>
                <PatientListPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<RouteLoader />}>
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin']}>
              <Suspense fallback={<RouteLoader />}>
                <ReportsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="community"
          element={
            <Suspense fallback={<RouteLoader />}>
              <CommunityPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
