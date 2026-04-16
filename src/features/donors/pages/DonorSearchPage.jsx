import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { donorSearchService } from '../services/donorSearchService.js';

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
        const errorMessage = requestError?.response?.data?.message || 'Failed to search donors.';
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

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Donor Directory</p>
        <h2>Find Available Donors</h2>
      </header>

      <div className="toolbar">
        <label htmlFor="bloodGroup">Blood Group</label>
        <select
          id="bloodGroup"
          value={bloodGroup}
          onChange={(event) => setBloodGroup(event.target.value)}
        >
          <option value="">All</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <label htmlFor="availabilityStatus">Availability</label>
        <select
          id="availabilityStatus"
          value={availabilityStatus}
          onChange={(event) => setAvailabilityStatus(event.target.value)}
        >
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="temporarily_unavailable">Temporarily Unavailable</option>
        </select>

        <button type="button" className="inline-link-btn" onClick={clearFilters}>
          Clear Filters
        </button>
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

      {error ? <p className="auth-error">{error}</p> : null}
      {isLoading ? <p className="page-loader">Loading donors...</p> : null}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Blood Group</th>
              <th>Location</th>
              <th>Status</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {results.map((donorProfile) => (
              <tr key={donorProfile.id}>
                <td>{donorProfile.donor?.name || 'N/A'}</td>
                <td>{donorProfile.bloodGroup}</td>
                <td>
                  {donorProfile.donor?.locationNames
                    ? [
                        donorProfile.donor.locationNames.division,
                        donorProfile.donor.locationNames.district,
                        donorProfile.donor.locationNames.upazila,
                        donorProfile.donor.locationNames.union,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                    : donorProfile.donor?.location || 'N/A'}
                </td>
                <td>
                  <span className={`status-chip ${donorProfile.availabilityStatus}`}>
                    {donorProfile.availabilityStatus}
                  </span>
                </td>
                <td>{donorProfile.donor?.phone || 'N/A'}</td>
              </tr>
            ))}
            {!isLoading && results.length === 0 ? (
              <tr>
                <td colSpan={5}>No donors found for selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <p className="auth-switch">
          Showing {results.length} of {meta.total} donors
        </p>
      ) : null}
    </section>
  );
};
