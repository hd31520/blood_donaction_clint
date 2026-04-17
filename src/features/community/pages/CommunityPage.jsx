import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { notificationService } from '../../notifications/services/notificationService.js';
import { reportService } from '../../reports/services/reportService.js';

const EVENT_CREATOR_ROLES = ['super_admin', 'district_admin', 'upazila_admin'];

const buildEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CommunityPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [volunteerFocus, setVolunteerFocus] = useState([]);
  const [communityEvents, setCommunityEvents] = useState([
    {
      id: buildEventId(),
      title: 'Monthly Blood Drive',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
      location: 'Community Hall',
      details: 'Coordinate donor outreach and transport support.',
    },
  ]);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    details: '',
  });

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

  const canCreateEvent = EVENT_CREATOR_ROLES.includes(user?.role);

  const headerStatus = useMemo(() => {
    if (isLoading) {
      return 'Refreshing community coordination data...';
    }

    return error || '';
  }, [error, isLoading]);

  const handleEventChange = (field) => (event) => {
    setEventForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const submitEvent = (event) => {
    event.preventDefault();

    if (!canCreateEvent) {
      toast.error('You are not allowed to add community events.');
      return;
    }

    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      toast.error('Please add a title, date, and location.');
      return;
    }

    setCommunityEvents((previous) => [
      {
        id: buildEventId(),
        title: eventForm.title.trim(),
        date: eventForm.date,
        location: eventForm.location.trim(),
        details: eventForm.details.trim(),
      },
      ...previous,
    ]);

    setEventForm({ title: '', date: '', location: '', details: '' });
    toast.success('Community event added.');
  };

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

        <article className="panel-card">
          <div className="panel-card-header">
            <h3>Community Events</h3>
            {canCreateEvent ? <span className="status-pill status-success">Event creator enabled</span> : null}
          </div>

          <ul className="list-clean community-event-list">
            {communityEvents.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <div className="muted-text">
                  {item.date} · {item.location}
                </div>
                {item.details ? <p className="muted-text compact-text">{item.details}</p> : null}
              </li>
            ))}
          </ul>

          {canCreateEvent ? (
            <form className="stack-form community-event-form" onSubmit={submitEvent}>
              <input
                type="text"
                placeholder="Event title"
                value={eventForm.title}
                onChange={handleEventChange('title')}
              />
              <input
                type="date"
                value={eventForm.date}
                onChange={handleEventChange('date')}
              />
              <input
                type="text"
                placeholder="Event location"
                value={eventForm.location}
                onChange={handleEventChange('location')}
              />
              <textarea
                rows="3"
                placeholder="Event details"
                value={eventForm.details}
                onChange={handleEventChange('details')}
              />
              <button type="submit" className="primary-button">Add Event</button>
            </form>
          ) : (
            <p className="muted-text compact-text">
              Event creation is available only for Super Admin, District Admin, and Upazila Admin.
            </p>
          )}
        </article>
      </div>
    </section>
  );
};
