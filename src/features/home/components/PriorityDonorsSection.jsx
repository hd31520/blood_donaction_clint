import { DonorCard } from './DonorCard.jsx';

export const PriorityDonorsSection = ({ donors }) => {
  if (!donors.length) {
    return null;
  }

  return (
    <section className="home-priority-section reveal delay-1">
      <header className="home-donor-grid-head">
        <h3>Priority Donors</h3>
        <p>Urgent blood groups and recently active donors are highlighted first.</p>
      </header>

      <div className="home-priority-grid">
        {donors.map((donorProfile) => (
          <DonorCard key={`priority-${donorProfile.id}`} donorProfile={donorProfile} priority />
        ))}
      </div>
    </section>
  );
};
