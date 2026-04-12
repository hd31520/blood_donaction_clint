import { memo } from 'react';
import { Link } from 'react-router-dom';

const DonorCardComponent = ({ donor }) => {
  return (
    <article className="donor-card">
      <div className="donor-card-head">
        <h3>{donor.name}</h3>
        <span className="blood-badge">{donor.bloodGroup}</span>
      </div>

      <p>
        <strong>Location:</strong> {donor.location}
      </p>
      <p>
        <strong>Last Donation:</strong> {donor.lastDonationDate}
      </p>

      <Link to={`/donors/${donor.id}`} className="view-btn inline-link-btn">
        View
      </Link>
    </article>
  );
};

export const DonorCard = memo(DonorCardComponent);
