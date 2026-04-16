import { Link } from 'react-router-dom';

const formatDonationDate = (value) => {
  if (!value) {
    return 'No donation record yet';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'No donation record yet';
  }

  return parsed.toLocaleDateString();
};

export const DonorCard = ({ donorProfile, priority = false }) => {
  const donor = donorProfile?.donor || {};
  const locationNames = donor.locationNames || {};

  return (
    <article className={`home-donor-card ${priority ? 'priority' : ''}`}>
      <div className="home-donor-head">
        <h4>{donor.name || 'Unknown Donor'}</h4>
        <span className="blood-badge">{donorProfile?.bloodGroup || 'N/A'}</span>
      </div>

      <p className="home-donor-location">
        {locationNames.district || 'District N/A'} / {locationNames.upazila || 'Upazila N/A'}
      </p>

      <div className="home-donor-meta">
        <span className={`status-chip ${donorProfile?.availabilityStatus || 'unavailable'}`}>
          {donorProfile?.availabilityStatus || 'unavailable'}
        </span>
        <span>Last donation: {formatDonationDate(donorProfile?.lastDonationDate)}</span>
      </div>

      <Link to={`/donors/${donorProfile?.userId}`} className="inline-link-btn small view-btn">
        View Donor
      </Link>
    </article>
  );
};
