import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { hospitalService } from '../services/hospitalService.js';

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  district_admin: 'District Admin',
  upazila_admin: 'Upazila Admin',
};

const BASE_FORM = {
  name: '',
  address: '',
  phone: '',
  divisionId: '',
  districtId: '',
  upazilaId: '',
  areaType: '',
  unionId: '',
  unionName: '',
  wardNumber: '',
};

export const HospitalManagementPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(BASE_FORM);
  const [hospitals, setHospitals] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationKey, setLocationKey] = useState(0);

  const canManageHospitals = useMemo(
    () => ['super_admin', 'district_admin', 'upazila_admin'].includes(user?.role),
    [user?.role],
  );

  const loadHospitals = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await hospitalService.listHospitals({ page: 1, limit: 100 });
      setHospitals(response.data || []);
      setMeta(response.meta || null);
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to load hospitals.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleLocationChange = (value) => {
    setForm((previous) => ({
      ...previous,
      divisionId: value.divisionId,
      districtId: value.districtId,
      upazilaId: value.upazilaId,
      areaType: value.areaType,
      unionId: value.unionId,
      unionName: value.unionName,
      wardNumber: value.wardNumber,
    }));
  };

  const resetForm = () => {
    setForm(BASE_FORM);
    setLocationKey((previous) => previous + 1);
  };

  const submitHospital = async (event) => {
    event.preventDefault();

    if (!canManageHospitals) {
      toast.error('You are not allowed to manage hospitals.');
      return;
    }

    if (!form.name || !form.divisionId || !form.districtId || !form.upazilaId || !form.areaType) {
      toast.error('Please fill in the required hospital fields.');
      return;
    }

    if ((form.areaType === 'union' || form.areaType === 'pouroshava') && !form.unionId && !form.unionName) {
      toast.error('Please select a union or enter a union name.');
      return;
    }

    if (form.areaType === 'pouroshava' && !form.wardNumber) {
      toast.error('Please provide a ward number for pouroshava hospitals.');
      return;
    }

    setIsSubmitting(true);

    try {
      await hospitalService.createHospital({
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
        divisionId: form.divisionId,
        districtId: form.districtId,
        upazilaId: form.upazilaId,
        areaType: form.areaType,
        unionId: form.unionId || undefined,
        unionName: form.unionName || undefined,
        wardNumber: form.wardNumber || undefined,
      });

      toast.success('Hospital created successfully.');
      resetForm();
      await loadHospitals();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to create hospital.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Hospital Management</p>
        <h2>Hospitals</h2>
        <p className="role-scope">
          {ROLE_LABEL[user?.role] || 'Admin'} can manage hospitals for their permitted scope.
        </p>
      </header>

      <article className="panel-card role-management-section">
        <h3>Add Hospital</h3>
        <form className="profile-form-grid" onSubmit={submitHospital}>
          <div className="home-filter-field">
            <label htmlFor="hospitalName">Hospital Name</label>
            <input id="hospitalName" value={form.name} onChange={handleChange('name')} />
          </div>

          <div className="home-filter-field">
            <label htmlFor="hospitalPhone">Phone</label>
            <input id="hospitalPhone" value={form.phone} onChange={handleChange('phone')} />
          </div>

          <div className="home-filter-field profile-full-width">
            <label htmlFor="hospitalAddress">Address</label>
            <input id="hospitalAddress" value={form.address} onChange={handleChange('address')} />
          </div>

          <div className="profile-full-width">
            <LocationSelector
              mode="filter"
              idPrefix="hospitalManagement"
              resetKey={locationKey}
              enableAutoDetect={false}
              onChange={handleLocationChange}
            />
          </div>

          <div className="profile-full-width role-management-actions">
            <button type="submit" className="inline-link-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Hospital'}
            </button>
          </div>
        </form>
      </article>

      <article className="panel-card role-management-section">
        <h3>Hospital List</h3>
        {isLoading ? <p className="muted-text">Loading hospitals...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="table-card role-management-table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Address</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.id}>
                  <td data-label="Name">{hospital.name}</td>
                  <td data-label="Location">
                    {[hospital.locationNames?.division, hospital.locationNames?.district, hospital.locationNames?.upazila, hospital.locationNames?.union, hospital.locationNames?.wardNumber]
                      .filter(Boolean)
                      .join(' / ') || 'N/A'}
                  </td>
                  <td data-label="Address">{hospital.address || 'N/A'}</td>
                  <td data-label="Phone">{hospital.phone || 'N/A'}</td>
                </tr>
              ))}
              {!isLoading && hospitals.length === 0 ? (
                <tr>
                  <td colSpan={4}>No hospitals found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {meta ? (
          <p className="auth-switch">
            Showing {hospitals.length} of {meta.total} hospitals
          </p>
        ) : null}
      </article>
    </section>
  );
};
