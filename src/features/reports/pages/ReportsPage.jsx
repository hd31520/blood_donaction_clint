import { StatCard } from '../../../components/ui/StatCard.jsx';

export const ReportsPage = () => {
  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Insights</p>
        <h2>Monthly Reporting</h2>
      </header>

      <div className="stats-grid">
        <StatCard title="Activity Rate" value="71.4%" subtitle="Based on active donors this month" />
        <StatCard title="Avg / Active Donor" value="2.8" subtitle="Donation frequency" />
        <StatCard title="CSV Exports" value="24" subtitle="Generated this quarter" />
      </div>

      <article className="panel-card">
        <h3>Export Center</h3>
        <p>
          Export monthly reports in CSV format and share with district, upazila, and union teams for
          planning campaigns.
        </p>
        <button type="button">Export April Report</button>
      </article>
    </section>
  );
};
