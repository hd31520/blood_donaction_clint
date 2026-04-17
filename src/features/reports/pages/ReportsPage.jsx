import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { StatCard } from '../../../components/ui/StatCard.jsx';
import { reportService } from '../services/reportService.js';

const toMonthOptions = (count = 12) => {
  const now = new Date();
  const options = [];

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    options.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: date.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    });
  }

  return options;
};

export const ReportsPage = () => {
  const monthOptions = useMemo(() => toMonthOptions(12), []);
  const [selectedPeriod, setSelectedPeriod] = useState(monthOptions[0]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await reportService.getMonthlyDonorReport({
          year: selectedPeriod.year,
          month: selectedPeriod.month,
        });

        if (isMounted) {
          setReport(data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message = requestError?.response?.data?.message || 'Failed to load monthly report.';
          setError(message);
          setReport(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [selectedPeriod.year, selectedPeriod.month]);

  const activityRate = Number(report?.donorActivity?.activityRate || 0);
  const averagePerActiveDonor = Number(report?.donationFrequency?.averagePerActiveDonor || 0);
  const totalDonations = Number(report?.donationFrequency?.totalDonations || 0);

  const exportCsv = async () => {
    setIsExporting(true);

    try {
      const blob = await reportService.exportMonthlyDonorReportCsv({
        year: selectedPeriod.year,
        month: selectedPeriod.month,
      });

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `monthly-donor-report-${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Insights</p>
        <h2>Monthly Reporting</h2>
        <label htmlFor="report-period" className="muted-text">
          Period
        </label>
        <select
          id="report-period"
          value={`${selectedPeriod.year}-${selectedPeriod.month}`}
          onChange={(event) => {
            const [yearText, monthText] = event.target.value.split('-');
            const matched = monthOptions.find(
              (option) => option.year === Number(yearText) && option.month === Number(monthText),
            );

            if (matched) {
              setSelectedPeriod(matched);
            }
          }}
        >
          {monthOptions.map((option) => (
            <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
              {option.label}
            </option>
          ))}
        </select>
      </header>

      <div className="stats-grid">
        <StatCard
          title="Activity Rate"
          value={isLoading ? '...' : `${activityRate.toFixed(2)}%`}
          subtitle="Based on active donors this month"
        />
        <StatCard
          title="Avg / Active Donor"
          value={isLoading ? '...' : averagePerActiveDonor.toFixed(2)}
          subtitle="Donation frequency"
        />
        <StatCard
          title="Total Donations"
          value={isLoading ? '...' : totalDonations.toLocaleString()}
          subtitle="Donations recorded in selected month"
        />
      </div>

      <article className="panel-card">
        <h3>Export Center</h3>
        <p>
          Export monthly reports in CSV format and share with district, upazila, and union teams for
          planning campaigns.
        </p>
        {error ? <p className="auth-error">{error}</p> : null}
        <button type="button" onClick={exportCsv} disabled={isLoading || isExporting || Boolean(error)}>
          {isExporting ? 'Exporting...' : `Export ${selectedPeriod.label} Report`}
        </button>
      </article>
    </section>
  );
};
