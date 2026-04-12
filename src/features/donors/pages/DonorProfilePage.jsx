import { Link, useParams } from 'react-router-dom';

import { getDonorById } from '../data/mockDonors.js';

export const DonorProfilePage = () => {
  const { donorId } = useParams();
  const donor = getDonorById(donorId);

  if (!donor) {
    return (
      <section className="feature-page reveal">
        <article className="panel-card donor-profile-page">
          <p className="eyebrow">Donor Profile</p>
          <h2>Profile Not Found</h2>
          <p>The requested donor profile could not be found.</p>
          <Link to="/donors" className="inline-link-btn">
            Back to Donor Search
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="feature-page reveal donor-profile-page">
      <header className="feature-header">
        <p className="eyebrow">Donor Details</p>
        <h2>{donor.name}</h2>
      </header>

      <div className="profile-top-grid">
        <article className="panel-card">
          <div className="profile-badge-row">
            <span className="blood-badge large">{donor.bloodGroup}</span>
            <span className={`status-chip ${donor.availability}`}>{donor.availability}</span>
          </div>

          <ul className="details-list">
            <li>
              <strong>Location</strong>
              <span>{donor.location}</span>
            </li>
            <li>
              <strong>District / Upazila / Union</strong>
              <span>{`${donor.district} / ${donor.upazila} / ${donor.union}`}</span>
            </li>
            <li>
              <strong>Last Donation Date</strong>
              <span>{donor.lastDonationDate}</span>
            </li>
            <li>
              <strong>Total Donations</strong>
              <span>{donor.totalDonations}</span>
            </li>
            <li>
              <strong>Age</strong>
              <span>{donor.age}</span>
            </li>
          </ul>

          <p className="profile-note">{donor.notes}</p>
        </article>

        <article className="panel-card">
          <h3>Contact Options</h3>
          <div className="contact-actions">
            <a href={`tel:${donor.phone}`} className="inline-link-btn">Call Donor</a>
            <a href={`mailto:${donor.email}`} className="inline-link-btn">Email Donor</a>
            <a href={`https://wa.me/${donor.phone.replace('+', '')}`} className="inline-link-btn">
              WhatsApp
            </a>
          </div>

          <ul className="details-list compact">
            <li>
              <strong>Phone</strong>
              <span>{donor.phone}</span>
            </li>
            <li>
              <strong>Email</strong>
              <span>{donor.email}</span>
            </li>
            <li>
              <strong>Preferred Contact</strong>
              <span>{donor.preferredContact}</span>
            </li>
          </ul>
        </article>
      </div>

      <article className="panel-card donation-history-card">
        <h3>Donation History</h3>
        <div className="history-timeline">
          {donor.donationHistory.map((entry) => (
            <div key={`${donor.id}-${entry.date}-${entry.location}`} className="timeline-item">
              <p className="timeline-date">{entry.date}</p>
              <p className="timeline-location">{entry.location}</p>
              <p className="timeline-type">{entry.type}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
