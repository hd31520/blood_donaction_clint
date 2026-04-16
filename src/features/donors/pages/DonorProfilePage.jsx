import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { donorSearchService } from '../services/donorSearchService.js';

export const DonorProfilePage = () => {
  const { donorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await donorSearchService.getPublicByUserId(donorId);
        setProfile(data);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load donor profile.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [donorId]);

  if (isLoading) {
    return <div className="page-loader">Loading donor profile...</div>;
  }

  if (error || !profile) {
    return (
      <section className="feature-page reveal">
        <article className="panel-card donor-profile-page">
          <p className="eyebrow">Donor Profile</p>
          <h2>Profile Not Found</h2>
          <p>{error || 'The requested donor profile could not be found.'}</p>
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
        <h2>{profile.name}</h2>
      </header>

      <div className="profile-top-grid">
        <article className="panel-card">
          <div className="profile-badge-row">
            <div className="profile-avatar-wrap">
              {profile.profileImageUrl ? (
                <img className="profile-avatar" src={profile.profileImageUrl} alt={profile.name} />
              ) : (
                <div className="profile-avatar placeholder">{profile.name?.slice(0, 1) || 'D'}</div>
              )}
            </div>
            <div className="profile-badge-stack">
              <span className="blood-badge large">{profile.bloodGroup || 'N/A'}</span>
              <span className={`status-chip ${profile.availabilityStatus || 'unavailable'}`}>
                {profile.availabilityStatus || 'unavailable'}
              </span>
            </div>
          </div>

          <ul className="details-list">
            <li>
              <strong>Location</strong>
              <span>{profile.location || 'N/A'}</span>
            </li>
            <li>
              <strong>District / Upazila / Union</strong>
              <span>
                {[
                  profile.locationNames?.district,
                  profile.locationNames?.upazila,
                  profile.locationNames?.union,
                ]
                  .filter(Boolean)
                  .join(' / ') || 'N/A'}
              </span>
            </li>
            <li>
              <strong>Last Donation Date</strong>
              <span>
                {profile.lastDonationDate
                  ? new Date(profile.lastDonationDate).toLocaleDateString()
                  : 'No donation recorded yet'}
              </span>
            </li>
            <li>
              <strong>Total Donations</strong>
              <span>{profile.donationHistory?.length || 0}</span>
            </li>
          </ul>
        </article>

        <article className="panel-card">
          <h3>Contact Options</h3>
          <p className="muted-text">
            Contact details are intentionally limited on the public profile.
          </p>

          <ul className="details-list compact">
            <li>
              <strong>Profile Status</strong>
              <span>{profile.availabilityStatus || 'unavailable'}</span>
            </li>
            <li>
              <strong>Public Record</strong>
              <span>Visible to everyone</span>
            </li>
          </ul>
        </article>
      </div>

      <article className="panel-card donation-history-card">
        <h3>Donation History</h3>
        <div className="history-timeline">
          {profile.donationHistory?.length ? (
            profile.donationHistory.map((entry, index) => (
              <div key={`${profile.userId}-${index}-${entry.donationDate}`} className="timeline-item">
                <p className="timeline-date">
                  {entry.donationDate ? new Date(entry.donationDate).toLocaleDateString() : 'Unknown date'}
                </p>
                <p className="timeline-location">{entry.location || 'Location not provided'}</p>
                <p className="timeline-type">{entry.notes || 'Donation recorded'}</p>
              </div>
            ))
          ) : (
            <p className="muted-text">No donation history available yet.</p>
          )}
        </div>
      </article>
    </section>
  );
};
