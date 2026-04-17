import { useEffect, useMemo, useState } from 'react';

import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { notificationService } from '../../notifications/services/notificationService.js';
import { reportService } from '../../reports/services/reportService.js';

export const CommunityPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [volunteerFocus, setVolunteerFocus] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDynamicCommunityData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const now = new Date();

        const [notificationsResult, oNegativeDonorsResult, monthlyReportResult] = await Promise.allSettled([
          notificationService.getMyNotifications({ page: 1, limit: 20 }),
          donorSearchService.searchAuthenticated({
            bloodGroup: 'O-',
            availabilityStatus: 'available',
            page: 1,
            limit: 1,
          }),
          reportService.getMonthlyDonorReport({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        const notifications = notificationsResult.status === 'fulfilled'
          ? notificationsResult.value?.data || []
          : [];

        const adminUpdates = notifications
          .filter((item) => String(item.type || '').toLowerCase() === 'admin_update')
          .slice(0, 3)
          .map((item) => {
            const createdAt = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                })
              : 'TBA';

            return `${item.title} - ${createdAt}`;
          });

        const oNegativeAvailableCount = oNegativeDonorsResult.status === 'fulfilled'
          ? Number(oNegativeDonorsResult.value?.meta?.total || 0)
          : 0;

        const inactiveDonorCount = monthlyReportResult.status === 'fulfilled'
          ? Number(monthlyReportResult.value?.donorActivity?.inactiveDonors || 0)
          : 0;

        const unreadCoordinationAlerts = notifications.filter((item) => !item.isRead).length;

        setUpcomingDrives(
          adminUpdates.length
            ? adminUpdates
            : ['No upcoming drives published yet. Check again soon.'],
        );

        setVolunteerFocus([
          `Reactivate inactive donors this month (${inactiveDonorCount.toLocaleString()} pending)`,
          `Maintain O- readiness (${oNegativeAvailableCount.toLocaleString()} available donors)`,
          `Review coordination alerts (${unreadCoordinationAlerts.toLocaleString()} unread)`,
        ]);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || 'Failed to load community coordination data.');
          setUpcomingDrives(['Unable to load upcoming drives at the moment.']);
          setVolunteerFocus(['Unable to load volunteer focus priorities right now.']);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDynamicCommunityData();

    return () => {
      isMounted = false;
    };
  }, []);

  const headerStatus = useMemo(() => {
    if (isLoading) {
      return 'Refreshing community coordination data...';
    }

    return error || '';
  }, [error, isLoading]);

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Network</p>
        <h2>Community Coordination</h2>
        {headerStatus ? <p className="muted-text">{headerStatus}</p> : null}
      </header>

      <div className="panel-grid">
        <article className="panel-card">
          <h3>Upcoming Drives</h3>
          <ul className="list-clean">
            {upcomingDrives.map((drive) => (
              <li key={drive}>{drive}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h3>Volunteer Focus</h3>
          <ul className="list-clean">
            {volunteerFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};
