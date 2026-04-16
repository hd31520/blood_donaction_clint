import { LocationSelector } from '../../../components/location/LocationSelector.jsx';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const FilterPanel = ({
  filters,
  onFilterChange,
  onLocationChange,
  onReset,
  locationResetKey,
  onCaptureLocation,
  locationCaptureMessage,
}) => {
  return (
    <section className="home-filter-panel reveal">
      <header className="home-filter-header">
        <h3>Search and Filter Donors</h3>
        <p>Filter by blood group, district, upazila, and availability status.</p>
      </header>

      <div className="home-filter-toolbar">
        <div className="home-filter-field">
          <label htmlFor="homeFilterBloodGroup">Blood Group</label>
          <select
            id="homeFilterBloodGroup"
            value={filters.bloodGroup}
            onChange={(event) => onFilterChange('bloodGroup', event.target.value)}
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUP_OPTIONS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="home-filter-field">
          <label htmlFor="homeFilterAvailability">Availability</label>
          <select
            id="homeFilterAvailability"
            value={filters.availabilityStatus}
            onChange={(event) => onFilterChange('availabilityStatus', event.target.value)}
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="temporarily_unavailable">Temporarily Unavailable</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <button type="button" className="retry-inline-btn" onClick={onCaptureLocation}>
          Use My Location (Beta)
        </button>

        <button type="button" className="inline-link-btn" onClick={onReset}>
          Reset Filters
        </button>
      </div>

      {locationCaptureMessage ? (
        <p className="home-location-helper">{locationCaptureMessage}</p>
      ) : (
        <p className="home-location-helper">
          Nearest donor ranking is being prepared. Your location can be captured for future
          location-distance sorting.
        </p>
      )}

      <LocationSelector
        mode="filter"
        idPrefix="homeFilter"
        resetKey={locationResetKey}
        enableAutoDetect={false}
        onChange={onLocationChange}
      />
    </section>
  );
};
