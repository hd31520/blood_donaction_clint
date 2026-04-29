import { ClipboardList, Home, LogIn, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { appRoutes } from '../../app/router/routesConfig.js';
import { NotificationCenter } from '../../components/global/NotificationCenter.jsx';
import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { NavItem } from '../navigation/NavItem.jsx';

const publicRoutes = [
  {
    key: 'home',
    label: 'হোম',
    path: '/home',
    icon: Home,
  },
  {
    key: 'patients',
    label: 'রক্তের প্রয়োজন',
    path: '/patients',
    icon: ClipboardList,
  },
  {
    key: 'login',
    label: 'লগইন',
    path: '/login',
    icon: LogIn,
  },
];

export const AppShell = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const visibleRoutes = isAuthenticated
    ? appRoutes.filter((route) => route.roles.includes(user?.role))
    : publicRoutes;

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isSidebarOpen]);

  return (
    <div className={`app-frame ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        id="mobile-sidebar"
        className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        <button
          type="button"
          className="sidebar-close-btn"
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={18} />
          <span>বন্ধ</span>
        </button>

        <div className="brand-block">
          <h1>বাংলা ব্লাড</h1>
          <p>রক্ত সহায়তার দায়িত্বশীল প্ল্যাটফর্ম</p>
        </div>

        {isAuthenticated ? (
          <div className="user-chip">
            {user?.profileImageUrl ? (
              <img className="user-chip-avatar" src={user.profileImageUrl} alt={user?.name || 'User'} />
            ) : null}
            <strong>{user?.name || 'ব্যবহারকারী'}</strong>
            <span>{user?.roleLabel || user?.role || ''}</span>
          </div>
        ) : null}

        {isAuthenticated ? <NotificationCenter /> : null}

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

        {isAuthenticated ? (
          <button
            type="button"
            className="logout-btn"
            onClick={() => {
              setIsSidebarOpen(false);
              logout();
            }}
          >
            লগআউট
          </button>
        ) : null}
      </aside>

      <div className="app-content-wrap">
        <header className="mobile-header compact-mobile-header">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={isSidebarOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-controls="mobile-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((previous) => !previous)}
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{isSidebarOpen ? 'বন্ধ' : 'মেনু'}</span>
          </button>

          <strong className="mobile-header-brand">বাংলা ব্লাড</strong>

          <Link to="/home" className="inline-link-btn mobile-home-link">
            হোম
          </Link>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
