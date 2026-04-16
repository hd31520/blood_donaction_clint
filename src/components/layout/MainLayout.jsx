import { NavLink } from 'react-router-dom';

const homeNavLinks = [
  { key: 'home', label: 'Home', path: '/home' },
  { key: 'donors', label: 'Donor Search', path: '/donors' },
  { key: 'community', label: 'Community', path: '/community' },
];

export const MainLayout = ({ children }) => {
  return (
    <section className="home-layout-shell">
      <aside className="home-layout-sidebar">
        <div className="home-layout-brand">
          <h1>Bangla Blood</h1>
          <p>Fast donor coordination across Bangladesh</p>
        </div>

        <nav className="home-layout-side-nav" aria-label="Homepage navigation">
          {homeNavLinks.map((link) => (
            <NavLink
              key={link.key}
              to={link.path}
              className={({ isActive }) =>
                `home-layout-side-link ${isActive ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="home-layout-sidebar-note">
          <p>Need blood urgently?</p>
          <strong>Use Donor Search with location filters for immediate results.</strong>
        </div>
      </aside>

      <div className="home-layout-main">
        <header className="home-layout-mobile-nav" aria-label="Homepage mobile navigation">
          {homeNavLinks.map((link) => (
            <NavLink
              key={link.key}
              to={link.path}
              className={({ isActive }) =>
                `home-layout-mobile-link ${isActive ? 'active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </header>

        <header className="home-layout-header">
          <p className="eyebrow">Blood Donation Platform</p>
          <h2>Save Time. Save Lives.</h2>
          <p>
            A responsive command center for donors, volunteers, and coordinators with clear
            location-aware workflows.
          </p>
        </header>

        <div className="home-layout-content">{children}</div>
      </div>
    </section>
  );
};
