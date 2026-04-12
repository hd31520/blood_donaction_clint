import { RoleSummaryPanel } from '../../../components/dashboard/RoleSummaryPanel.jsx';
import { MiniBarChart } from '../../../components/charts/MiniBarChart.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { roleDashboardData } from '../config/roleDashboardData.js';

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleData = roleDashboardData[user?.role] || roleDashboardData.donor;

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Role Dashboard</p>
        <h2>{roleData.label} Control Center</h2>
        <p className="role-scope">{roleData.scope}</p>
      </header>

      <RoleSummaryPanel summaries={roleData.summaries} />

      <div className="panel-grid dashboard-grid">
        <article className="panel-card">
          <h3>Activity Chart</h3>
          <p className="muted-text">Monthly donation activity in current access scope</p>
          <MiniBarChart data={roleData.chartSeries} />
        </article>

        <article className="panel-card">
          <h3>Role Controls</h3>
          <ul className="list-clean">
            {roleData.controls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card access-panel">
          <h3>Access Boundaries</h3>
          <ul className="list-clean">
            {roleData.accessSummary.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h3>Quick Summary</h3>
          <p className="muted-text">
            This dashboard automatically adapts available controls and metrics based on authenticated
            user role and geographic scope.
          </p>
          <button type="button">Open Full Analytics</button>
        </article>
      </div>
    </section>
  );
};
