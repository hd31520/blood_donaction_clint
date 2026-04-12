import { StatCard } from '../ui/StatCard.jsx';

export const RoleSummaryPanel = ({ summaries }) => {
  return (
    <div className="stats-grid">
      {summaries.map((summary) => (
        <StatCard
          key={summary.title}
          title={summary.title}
          value={summary.value}
          subtitle={summary.subtitle}
        />
      ))}
    </div>
  );
};
