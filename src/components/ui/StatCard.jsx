import { memo } from 'react';

const StatCardComponent = ({ title, value, subtitle }) => {
  return (
    <article className="stat-card">
      <p className="stat-card-title">{title}</p>
      <h3>{value}</h3>
      <p className="stat-card-subtitle">{subtitle}</p>
    </article>
  );
};

export const StatCard = memo(StatCardComponent);
