import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { donorSearchService } from '../services/donorSearchService.js';

const AVAILABILITY_LABELS = {
  available: 'প্রস্তুত',
  unavailable: 'অনুপলব্ধ',
  temporarily_unavailable: 'সাময়িক অনুপলব্ধ',
};

const formatDate = (value) => {
  if (!value) {
    return 'উল্লেখ নেই';
  }

  return new Date(value).toLocaleDateString('bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getEligibilityLabel = (donorProfile) => {
  if (donorProfile.isEligibleForDonation) {
    return 'রক্তদানের জন্য উপযুক্ত';
  }

  const daysLeft = Number(donorProfile.daysUntilEligible || 0).toLocaleString('bn-BD');
  return `${daysLeft} দিন পরে উপযুক্ত`;
};

const getResolvedAvailability = (donorProfile) => {
  if (!donorProfile.isEligibleForDonation) {
    return 'temporarily_unavailable';
  }

  return donorProfile.availabilityStatus || 'available';
};

export const DonorSearchPage = () => {
  const [bloodGroup, setBloodGroup] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationFilters, setLocationFilters] = useState({
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
  });
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const searchFilters = useMemo(
    () => ({
      bloodGroup,
      availabilityStatus,
      divisionId: locationFilters.divisionId,
      districtId: locationFilters.districtId,
      upazilaId: locationFilters.upazilaId,
      unionId: locationFilters.unionId,
      page: 1,
      limit: 20,
    }),
    [
      bloodGroup,
      availabilityStatus,
      locationFilters.divisionId,
      locationFilters.districtId,
      locationFilters.upazilaId,
      locationFilters.unionId,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await donorSearchService.search(searchFilters);
        setResults(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        const errorMessage = requestError?.response?.data?.message || 'রক্তদাতা খুঁজে পাওয়া যায়নি।';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchFilters]);

  const clearFilters = () => {
    setBloodGroup('');
    setAvailabilityStatus('');
    setLocationFilters({
      divisionId: '',
      districtId: '',
      upazilaId: '',
      unionId: '',
    });
    setLocationResetKey((previous) => previous + 1);
  };

  const closeFilterDialog = () => {
    setIsFilterOpen(false);
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <div>
          <p className="eyebrow">অ্যাডমিন তালিকা</p>
          <h2>রক্তদাতা তালিকা</h2>
        </div>
        <button type="button" className="inline-link-btn ghost-action" onClick={() => setIsFilterOpen(true)}>
          Filter
        </button>
      </header>

      {isFilterOpen ? (
        <div className="filter-dialog-backdrop" role="presentation" onMouseDown={closeFilterDialog}>
          <section
            className="filter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="donorFilterDialogTitle"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="filter-dialog-header">
              <div>
                <p className="eyebrow">Filter</p>
                <h3 id="donorFilterDialogTitle">রক্তদাতা খুঁজুন</h3>
              </div>
              <button type="button" className="filter-dialog-close" aria-label="Close filter dialog" onClick={closeFilterDialog}>
                ×
              </button>
            </div>

            <div className="filter-dialog-form">
              <div className="filter-dialog-grid">
                <label htmlFor="bloodGroup">রক্তের গ্রুপ</label>
                <select
                  id="bloodGroup"
                  value={bloodGroup}
                  onChange={(event) => setBloodGroup(event.target.value)}
                >
                  <option value="">সব</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                <label htmlFor="availabilityStatus">প্রাপ্যতা</label>
                <select
                  id="availabilityStatus"
                  value={availabilityStatus}
                  onChange={(event) => setAvailabilityStatus(event.target.value)}
                >
                  <option value="">সব</option>
                  <option value="available">প্রস্তুত</option>
                  <option value="unavailable">অনুপলব্ধ</option>
                  <option value="temporarily_unavailable">সাময়িক অনুপলব্ধ</option>
                </select>
              </div>

              <LocationSelector
                mode="filter"
                idPrefix="donorSearch"
                resetKey={locationResetKey}
                enableAutoDetect={false}
                onChange={(value) => {
                  setLocationFilters({
                    divisionId: value.divisionId,
                    districtId: value.districtId,
                    upazilaId: value.upazilaId,
                    unionId: value.unionId,
                  });
                }}
              />

              <div className="filter-dialog-actions">
                <button type="button" className="inline-link-btn ghost-action" onClick={clearFilters}>
                  ফিল্টার মুছুন
                </button>
                <button type="button" className="inline-link-btn" onClick={closeFilterDialog}>
                  Apply Filter
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {error ? <p className="auth-error">{error}</p> : null}
      {isLoading ? <p className="page-loader">রক্তদাতা লোড হচ্ছে...</p> : null}

      <div className="table-card donor-table-card">
        <table>
          <thead>
            <tr>
              <th>নাম</th>
              <th>রক্তের গ্রুপ</th>
              <th>লোকেশন</th>
              <th>অবস্থা</th>
              <th>যোগ্যতা</th>
              <th>শেষ রক্তদান</th>
              <th>পরবর্তী তারিখ</th>
              <th>যোগাযোগ</th>
              <th>চ্যাট</th>
            </tr>
          </thead>
          <tbody>
            {results.map((donorProfile) => {
              const resolvedAvailability = getResolvedAvailability(donorProfile);
              const canContact = donorProfile.isEligibleForDonation && resolvedAvailability === 'available';

              return (
                <tr key={donorProfile.id}>
                  <td data-label="নাম">{donorProfile.donor?.name || 'উল্লেখ নেই'}</td>
                  <td data-label="রক্তের গ্রুপ">{donorProfile.bloodGroup}</td>
                  <td data-label="লোকেশন">
                    {donorProfile.donor?.locationNames
                      ? [
                          donorProfile.donor.locationNames.division,
                          donorProfile.donor.locationNames.district,
                          donorProfile.donor.locationNames.upazila,
                          donorProfile.donor.locationNames.union,
                        ]
                          .filter(Boolean)
                          .join(' / ')
                      : donorProfile.donor?.location || 'উল্লেখ নেই'}
                  </td>
                  <td data-label="অবস্থা">
                    <span className={`status-chip ${resolvedAvailability}`}>
                      {AVAILABILITY_LABELS[resolvedAvailability] || resolvedAvailability}
                    </span>
                  </td>
                  <td data-label="যোগ্যতা">{getEligibilityLabel(donorProfile)}</td>
                  <td data-label="শেষ রক্তদান">{formatDate(donorProfile.lastDonationDate)}</td>
                  <td data-label="পরবর্তী তারিখ">{formatDate(donorProfile.nextEligibleDonationDate)}</td>
                  <td data-label="যোগাযোগ">
                    {canContact ? donorProfile.donor?.phone || 'গোপন' : <span className="muted-text">এখন নয়</span>}
                  </td>
                  <td data-label="চ্যাট">
                    {canContact && donorProfile.donor?.contactPreferences?.allowDonorChat !== false && donorProfile.donor?.phone ? (
                      <Link
                        className="inline-link-btn"
                        to={`/chat?targetUserId=${encodeURIComponent(String(donorProfile.userId || ''))}`}
                      >
                        চ্যাট
                      </Link>
                    ) : (
                      <span className="muted-text">চালু নেই</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!isLoading && results.length === 0 ? (
              <tr>
                <td colSpan={9}>এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি।</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <p className="auth-switch">
          মোট {Number(meta.total || 0).toLocaleString('bn-BD')} জনের মধ্যে {results.length.toLocaleString('bn-BD')} জন দেখানো হচ্ছে
        </p>
      ) : null}
    </section>
  );
};
