import { memo } from 'react';
import { NavLink } from 'react-router-dom';

const NavItemComponent = ({ to, icon: Icon, label, mobile = false, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${mobile ? 'mobile-nav-item' : 'sidebar-nav-item'} ${isActive ? 'active' : ''}`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
};

export const NavItem = memo(NavItemComponent);
