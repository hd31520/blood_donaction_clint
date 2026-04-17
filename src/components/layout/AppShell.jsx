import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { appRoutes } from '../../app/router/routesConfig.js';
import { NotificationCenter } from '../../components/global/NotificationCenter.jsx';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { NavItem } from '../navigation/NavItem.jsx';

export const AppShell = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const visibleRoutes = appRoutes.filter((route) => route.roles.includes(user?.role));

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <div className={`app-frame ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside id="mobile-sidebar" className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="brand-block">
          <h1>Bangla Blood</h1>
          <p>Smart donor operations platform</p>
        </div>

        <div className="user-chip">
          {user?.profileImageUrl ? (
            <img className="user-chip-avatar" src={user.profileImageUrl} alt={user?.name || 'User'} />
          ) : null}
          <strong>{user?.name || 'User'}</strong>
          <span>{user?.role || 'guest'}</span>
        </div>

        <NotificationCenter />

        <nav className="sidebar-nav">
          {visibleRoutes.map((route) => (
            <NavItem
              key={route.key}
              to={route.path}
              icon={route.icon}
              label={route.label}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            setIsSidebarOpen(false);
            logout();
          }}
        >
          Logout
        </button>
      </aside>

      <div className="app-content-wrap">
        <header className="mobile-header">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
            aria-controls="mobile-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((previous) => !previous)}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{isSidebarOpen ? 'Close' : 'Menu'}</span>
          </button>

          <div>
            <p className="eyebrow">Bangladesh Blood Network</p>
            <h2>Bangla Blood</h2>
          </div>
          <Link to="/home" className="inline-link-btn">
            Home
          </Link>
          <NotificationCenter />
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
