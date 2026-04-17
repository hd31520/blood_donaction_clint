import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { RoleSummaryPanel } from '../../../components/dashboard/RoleSummaryPanel.jsx';
import { MiniBarChart } from '../../../components/charts/MiniBarChart.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { reportService } from '../../reports/services/reportService.js';
import { roleDashboardData } from '../config/roleDashboardData.js';

const formatNumber = (value) => Number(value || 0).toLocaleString();

const toMonthLabel = (year, month) => {
  return new Date(year, month - 1, 1).toLocaleString(undefined, { month: 'short' });
};

const getRecentMonths = (count = 6) => {
  const months = [];
  const now = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }

  return months;
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleData = roleDashboardData[user?.role] || roleDashboardData.donor;
  const [isLoading, setIsLoading] = useState(true);
  const [summaryValues, setSummaryValues] = useState(null);
  const [chartSeries, setChartSeries] = useState(roleData.chartSeries);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);

      const months = getRecentMonths(6);

      try {
        const [allDonorsResult, availableDonorsResult, monthlyReportsResult] = await Promise.allSettled([
          donorSearchService.searchAuthenticated({ page: 1, limit: 1 }),
          donorSearchService.searchAuthenticated({ availabilityStatus: 'available', page: 1, limit: 1 }),
          Promise.allSettled(
            months.map(({ year, month }) => reportService.getMonthlyDonorReport({ year, month })),
          ),
        ]);

        const totalDonors = allDonorsResult.status === 'fulfilled'
          ? Number(allDonorsResult.value?.meta?.total || 0)
          : 0;

        const availableDonors = availableDonorsResult.status === 'fulfilled'
          ? Number(availableDonorsResult.value?.meta?.total || 0)
          : 0;

        const fulfilledReports = monthlyReportsResult.status === 'fulfilled'
          ? monthlyReportsResult.value
              .filter((item) => item.status === 'fulfilled' && item.value)
              .map((item) => item.value)
          : [];

        const latestReport = fulfilledReports.length ? fulfilledReports[fulfilledReports.length - 1] : null;

        const dynamicChartSeries = monthlyReportsResult.status === 'fulfilled'
          ? monthlyReportsResult.value.map((item, index) => {
              const monthRef = months[index];
              const report = item.status === 'fulfilled' ? item.value : null;

              return {
                label: toMonthLabel(monthRef.year, monthRef.month),
                value: report?.donationFrequency?.totalDonations || 0,
              };
            })
          : roleData.chartSeries;

        if (!isMounted) {
          return;
        }

        setSummaryValues({
          totalDonors,
          availableDonors,
          activeDonors: latestReport?.donorActivity?.activeDonors || 0,
          activityRate: latestReport?.donorActivity?.activityRate || 0,
          totalDonations: latestReport?.donationFrequency?.totalDonations || 0,
        });

        setChartSeries(dynamicChartSeries);
      } catch (error) {
        if (isMounted) {
          toast.error('Failed to load dynamic dashboard metrics. Showing fallback values.');
          setChartSeries(roleData.chartSeries);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [roleData.chartSeries]);

  const resolvedSummaries = useMemo(() => {
    if (!summaryValues) {
      return roleData.summaries;
    }

    const summaryMap = [
      {
        value: formatNumber(summaryValues.totalDonors),
        subtitle: 'Visible donors in your access scope',
      },
      {
        value: formatNumber(summaryValues.availableDonors || summaryValues.activeDonors),
        subtitle: 'Currently available or active donors',
      },
      {
        value: `${Number(summaryValues.activityRate || 0).toFixed(2)}%`,
        subtitle: `Monthly activity rate (${formatNumber(summaryValues.totalDonations)} donations)`,
      },
    ];

    return roleData.summaries.map((summary, index) => ({
      ...summary,
      value: summaryMap[index]?.value || summary.value,
      subtitle: summaryMap[index]?.subtitle || summary.subtitle,
    }));
  }, [roleData.summaries, summaryValues]);

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Role Dashboard</p>
        <h2>{roleData.label} Control Center</h2>
        <p className="role-scope">{roleData.scope}</p>
        {isLoading ? <p className="muted-text">Refreshing live dashboard data...</p> : null}
        <Link to="/home" className="inline-link-btn">
          Home
        </Link>
      </header>

      <RoleSummaryPanel summaries={resolvedSummaries} />

      <div className="panel-grid dashboard-grid">
        <article className="panel-card">
          <h3>Activity Chart</h3>
          <p className="muted-text">Monthly donation activity in current access scope</p>
          <MiniBarChart data={chartSeries} />
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
