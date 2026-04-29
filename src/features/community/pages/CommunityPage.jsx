import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../auth/context/AuthContext.jsx';

const EVENT_CREATOR_ROLES = ['super_admin', 'district_admin', 'upazila_admin', 'union_leader', 'ward_admin'];

const buildEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CommunityPage = () => {
  const { user } = useAuth();
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
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

  const canCreateEvent = EVENT_CREATOR_ROLES.includes(user?.role);

  const handleEventChange = (field) => (event) => {
    setEventForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const closeEventDialog = () => {
    setIsEventDialogOpen(false);
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
    setIsEventDialogOpen(false);
    toast.success('কমিউনিটি ইভেন্ট যোগ হয়েছে।');
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <div>
          <p className="eyebrow">কমিউনিটি</p>
          <h2>কমিউনিটি ইভেন্ট</h2>
        </div>
        {canCreateEvent ? (
          <button type="button" className="inline-link-btn" onClick={() => setIsEventDialogOpen(true)}>
            ইভেন্ট যোগ করুন
          </button>
        ) : null}
      </header>

      <article className="panel-card">
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
      </article>

      {isEventDialogOpen ? (
        <div className="app-dialog-backdrop" role="presentation" onMouseDown={closeEventDialog}>
          <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="communityEventDialogTitle" onMouseDown={(event) => event.stopPropagation()}>
            <div className="app-dialog-header">
              <div>
                <p className="eyebrow">কমিউনিটি ইভেন্ট</p>
                <h3 id="communityEventDialogTitle">ইভেন্ট যোগ করুন</h3>
              </div>
              <button type="button" className="app-dialog-close" aria-label="Close event dialog" onClick={closeEventDialog}>
                ×
              </button>
            </div>

            <form className="app-dialog-form" onSubmit={submitEvent}>
              <div className="app-dialog-grid">
                <div className="home-filter-field app-dialog-full">
                  <label htmlFor="eventTitle">ইভেন্ট শিরোনাম</label>
                  <input
                    id="eventTitle"
                    type="text"
                    value={eventForm.title}
                    onChange={handleEventChange('title')}
                  />
                </div>

                <div className="home-filter-field">
                  <label htmlFor="eventDate">তারিখ</label>
                  <input
                    id="eventDate"
                    type="date"
                    value={eventForm.date}
                    onChange={handleEventChange('date')}
                  />
                </div>

                <div className="home-filter-field">
                  <label htmlFor="eventLocation">লোকেশন</label>
                  <input
                    id="eventLocation"
                    type="text"
                    value={eventForm.location}
                    onChange={handleEventChange('location')}
                  />
                </div>

                <div className="home-filter-field app-dialog-full">
                  <label htmlFor="eventDetails">বিস্তারিত</label>
                  <textarea
                    id="eventDetails"
                    rows="3"
                    value={eventForm.details}
                    onChange={handleEventChange('details')}
                  />
                </div>
              </div>

              <div className="app-dialog-actions">
                <button type="button" className="inline-link-btn ghost-action" onClick={closeEventDialog}>
                  বন্ধ করুন
                </button>
                <button type="submit" className="inline-link-btn">
                  ইভেন্ট যোগ করুন
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
};
