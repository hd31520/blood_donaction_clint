import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute } from './GuestRoute.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { AppShell } from '../../components/layout/AppShell.jsx';

const CommunityPage = lazy(() => import('../../features/community/pages/CommunityPage.jsx').then((module) => ({ default: module.CommunityPage })));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage.jsx').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })));
const DonorProfilePage = lazy(() => import('../../features/donors/pages/DonorProfilePage.jsx').then((module) => ({ default: module.DonorProfilePage })));
const DonorSearchPage = lazy(() => import('../../features/donors/pages/DonorSearchPage.jsx').then((module) => ({ default: module.DonorSearchPage })));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage.jsx').then((module) => ({ default: module.ReportsPage })));

const RouteLoader = () => <div className="page-loader">Loading page...</div>;

export const AppRouter = () => {
  return (
    <Routes>
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
        <Route index element={<Navigate to="/dashboard" replace />} />
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
            <Suspense fallback={<RouteLoader />}>
              <DonorSearchPage />
            </Suspense>
          }
        />
        <Route
          path="donors/:donorId"
          element={
            <Suspense fallback={<RouteLoader />}>
              <DonorProfilePage />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'district_admin', 'upazila_admin', 'union_leader']}>
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
