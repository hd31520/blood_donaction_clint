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
  return new Date(year, month - 1, 1).toLocaleString('bn-BD', { month: 'short' });
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
          toast.error('ড্যাশবোর্ডের লাইভ তথ্য লোড হয়নি। সংরক্ষিত তথ্য দেখানো হচ্ছে।');
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
        subtitle: 'আপনার অনুমোদিত এলাকার রক্তদাতা',
      },
      {
        value: formatNumber(summaryValues.availableDonors || summaryValues.activeDonors),
        subtitle: 'এখন প্রস্তুত বা সক্রিয় রক্তদাতা',
      },
      {
        value: `${Number(summaryValues.activityRate || 0).toFixed(2)}%`,
        subtitle: `মাসিক সক্রিয়তা (${formatNumber(summaryValues.totalDonations)} রক্তদান)`,
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
        <p className="eyebrow">Role ড্যাশবোর্ড</p>
        <h2>{roleData.label} কন্ট্রোল সেন্টার</h2>
        <p className="role-scope">{roleData.scope}</p>
        {isLoading ? <p className="muted-text">লাইভ ড্যাশবোর্ড তথ্য রিফ্রেশ হচ্ছে...</p> : null}
        <Link to="/home" className="inline-link-btn">
          হোম
        </Link>
      </header>

      <RoleSummaryPanel summaries={resolvedSummaries} />

      <div className="panel-grid dashboard-grid">
        <article className="panel-card">
          <h3>কার্যক্রম চার্ট</h3>
          <p className="muted-text">আপনার অনুমোদিত এলাকার মাসিক রক্তদান</p>
          <MiniBarChart data={chartSeries} />
        </article>

        <article className="panel-card">
          <h3>Role কন্ট্রোল</h3>
          <ul className="list-clean">
            {roleData.controls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card access-panel">
          <h3>অ্যাক্সেস সীমা</h3>
          <ul className="list-clean">
            {roleData.accessSummary.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h3>সংক্ষিপ্ত সারাংশ</h3>
          <p className="muted-text">
            আপনার role ও এলাকার ভিত্তিতে এই ড্যাশবোর্ডের কন্ট্রোল ও পরিসংখ্যান বদলায়।
          </p>
          <button type="button">পূর্ণ অ্যানালিটিক্স খুলুন</button>
        </article>
      </div>
    </section>
  );
};
