import { Outlet } from 'react-router-dom';

import { appRoutes } from '../../app/router/routesConfig.js';
import { NotificationCenter } from '../../components/global/NotificationCenter.jsx';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { NavItem } from '../navigation/NavItem.jsx';

export const AppShell = () => {
  const { user, logout } = useAuth();
  const visibleRoutes = appRoutes.filter((route) => route.roles.includes(user?.role));

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-block">
          <h1>Bangla Blood</h1>
          <p>Smart donor operations platform</p>
        </div>

        <div className="user-chip">
          <strong>{user?.name || 'User'}</strong>
          <span>{user?.role || 'guest'}</span>
        </div>

        <NotificationCenter />

        <nav className="sidebar-nav">
          {visibleRoutes.map((route) => (
            <NavItem key={route.key} to={route.path} icon={route.icon} label={route.label} />
          ))}
        </nav>

        <button type="button" className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <div className="app-content-wrap">
        <header className="mobile-header">
          <div>
            <p className="eyebrow">Bangladesh Blood Network</p>
            <h2>Bangla Blood</h2>
          </div>
          <NotificationCenter />
        </header>

        <main className="app-content">
          <Outlet />
        </main>

        <nav className="mobile-nav">
          {visibleRoutes.map((route) => (
            <NavItem key={route.key} to={route.path} icon={route.icon} label={route.label} mobile />
          ))}
        </nav>
      </div>
    </div>
  );
};
