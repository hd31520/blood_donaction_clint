import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { notificationService } from '../../notifications/services/notificationService.js';
import { reportService } from '../../reports/services/reportService.js';

const EVENT_CREATOR_ROLES = ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'];

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
      title: 'মাসিক রক্তদান কর্মসূচি',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
      location: 'কমিউনিটি হল',
      details: 'রক্তদাতা যোগাযোগ ও পরিবহন সহায়তা সমন্বয়।',
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
              : 'তারিখ পরে জানানো হবে';

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
            : ['এখনও কোনো রক্তদান কর্মসূচি প্রকাশ হয়নি। পরে আবার দেখুন।'],
        );

        setVolunteerFocus([
          `এই মাসে নিষ্ক্রিয় রক্তদাতাদের সক্রিয় করুন (${inactiveDonorCount.toLocaleString('bn-BD')} বাকি)`,
          `O- প্রস্তুতি রাখুন (${oNegativeAvailableCount.toLocaleString('bn-BD')} জন প্রস্তুত)`,
          `সমন্বয় অ্যালার্ট দেখুন (${unreadCoordinationAlerts.toLocaleString('bn-BD')}টি অপঠিত)`,
        ]);
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || 'কমিউনিটি তথ্য লোড করা যায়নি।');
          setUpcomingDrives(['এই মুহূর্তে কর্মসূচি লোড করা যাচ্ছে না।']);
          setVolunteerFocus(['এই মুহূর্তে অগ্রাধিকার তালিকা লোড করা যাচ্ছে না।']);
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
      return 'কমিউনিটি তথ্য রিফ্রেশ হচ্ছে...';
    }

    return error || '';
  }, [error, isLoading]);

  const handleEventChange = (field) => (event) => {
    setEventForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const submitEvent = (event) => {
    event.preventDefault();

    if (!canCreateEvent) {
      toast.error('কমিউনিটি ইভেন্ট যোগ করার অনুমতি নেই।');
      return;
    }

    if (!eventForm.title || !eventForm.date || !eventForm.location) {
      toast.error('শিরোনাম, তারিখ ও লোকেশন দিন।');
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
    toast.success('কমিউনিটি ইভেন্ট যোগ হয়েছে।');
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">নেটওয়ার্ক</p>
        <h2>কমিউনিটি সমন্বয়</h2>
        {headerStatus ? <p className="muted-text">{headerStatus}</p> : null}
      </header>

      <div className="panel-grid">
        <article className="panel-card">
          <h3>আসন্ন রক্তদান কর্মসূচি</h3>
          <ul className="list-clean">
            {upcomingDrives.map((drive) => (
              <li key={drive}>{drive}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h3>স্বেচ্ছাসেবী অগ্রাধিকার</h3>
          <ul className="list-clean">
            {volunteerFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <h3>কমিউনিটি ইভেন্ট</h3>
            {canCreateEvent ? <span className="status-pill status-success">ইভেন্ট তৈরি চালু</span> : null}
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
                placeholder="ইভেন্ট শিরোনাম"
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
                placeholder="ইভেন্ট লোকেশন"
                value={eventForm.location}
                onChange={handleEventChange('location')}
              />
              <textarea
                rows="3"
                placeholder="ইভেন্টের বিস্তারিত"
                value={eventForm.details}
                onChange={handleEventChange('details')}
              />
              <button type="submit" className="primary-button">ইভেন্ট যোগ করুন</button>
            </form>
          ) : (
            <p className="muted-text compact-text">
              ইভেন্ট তৈরি শুধু অ্যাডমিনদের জন্য চালু আছে।
            </p>
          )}
        </article>
      </div>
    </section>
  );
};
