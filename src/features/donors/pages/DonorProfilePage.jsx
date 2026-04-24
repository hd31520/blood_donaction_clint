import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { donorSearchService } from '../services/donorSearchService.js';

const AVAILABILITY_LABELS = {
  available: 'প্রস্তুত',
  unavailable: 'অনুপলব্ধ',
  temporarily_unavailable: 'সাময়িক অনুপলব্ধ',
};

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
        setError(requestError?.response?.data?.message || 'রক্তদাতার প্রোফাইল লোড করা যায়নি।');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [donorId]);

  if (isLoading) {
    return <div className="page-loader">প্রোফাইল লোড হচ্ছে...</div>;
  }

  if (error || !profile) {
    return (
      <section className="feature-page reveal">
        <article className="panel-card donor-profile-page">
          <p className="eyebrow">রক্তদাতার প্রোফাইল</p>
          <h2>প্রোফাইল পাওয়া যায়নি</h2>
          <p>{error || 'চাওয়া রক্তদাতার প্রোফাইল পাওয়া যায়নি।'}</p>
          <Link to="/donors" className="inline-link-btn">
            রক্তদাতা তালিকায় ফিরুন
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="feature-page reveal donor-profile-page">
      <header className="feature-header">
        <p className="eyebrow">রক্তদাতার তথ্য</p>
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
                {AVAILABILITY_LABELS[profile.availabilityStatus] || 'অনুপলব্ধ'}
              </span>
            </div>
          </div>

          <ul className="details-list">
            <li>
              <strong>লোকেশন</strong>
              <span>{profile.location || 'উল্লেখ নেই'}</span>
            </li>
            <li>
              <strong>জেলা / উপজেলা / ইউনিয়ন</strong>
              <span>
                {[
                  profile.locationNames?.district,
                  profile.locationNames?.upazila,
                  profile.locationNames?.union,
                ]
                  .filter(Boolean)
                  .join(' / ') || 'উল্লেখ নেই'}
              </span>
            </li>
            <li>
              <strong>শেষ রক্তদানের তারিখ</strong>
              <span>
                {profile.lastDonationDate
                  ? new Date(profile.lastDonationDate).toLocaleDateString('bn-BD')
                  : 'এখনও রেকর্ড নেই'}
              </span>
            </li>
            <li>
              <strong>মোট রক্তদান</strong>
              <span>{profile.donationHistory?.length || 0}</span>
            </li>
          </ul>
        </article>

        <article className="panel-card">
          <h3>যোগাযোগ</h3>
          <p className="muted-text">
            রক্তদাতার তথ্য শুধু অনুমোদিত অ্যাডমিনদের জন্য দেখানো হচ্ছে।
          </p>

          <ul className="details-list compact">
            <li>
              <strong>প্রোফাইল অবস্থা</strong>
              <span>{AVAILABILITY_LABELS[profile.availabilityStatus] || 'অনুপলব্ধ'}</span>
            </li>
            <li>
              <strong>প্রাইভেসি</strong>
              <span>শুধু অ্যাডমিনদের জন্য</span>
            </li>
          </ul>
        </article>
      </div>

      <article className="panel-card donation-history-card">
        <h3>রক্তদানের ইতিহাস</h3>
        <div className="history-timeline">
          {profile.donationHistory?.length ? (
            profile.donationHistory.map((entry, index) => (
              <div key={`${profile.userId}-${index}-${entry.donationDate}`} className="timeline-item">
                <p className="timeline-date">
                  {entry.donationDate ? new Date(entry.donationDate).toLocaleDateString('bn-BD') : 'তারিখ নেই'}
                </p>
                <p className="timeline-location">{entry.location || 'লোকেশন দেওয়া নেই'}</p>
                <p className="timeline-type">{entry.notes || 'রক্তদান রেকর্ড হয়েছে'}</p>
              </div>
            ))
          ) : (
            <p className="muted-text">এখনও কোনো রক্তদানের ইতিহাস নেই।</p>
          )}
        </div>
      </article>
    </section>
  );
};
