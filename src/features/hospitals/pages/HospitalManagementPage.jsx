import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { hospitalService } from '../services/hospitalService.js';

const ROLE_LABEL = {
  super_admin: 'সুপার অ্যাডমিন',
  district_admin: 'জেলা অ্যাডমিন',
  upazila_admin: 'উপজেলা অ্যাডমিন',
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
      const message = requestError?.response?.data?.message || 'হাসপাতাল তালিকা লোড করা যায়নি।';
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
      toast.error('হাসপাতাল ব্যবস্থাপনার অনুমতি নেই।');
      return;
    }

    if (!form.name || !form.divisionId || !form.districtId || !form.upazilaId || !form.areaType) {
      toast.error('হাসপাতালের প্রয়োজনীয় তথ্য পূরণ করুন।');
      return;
    }

    if ((form.areaType === 'union' || form.areaType === 'pouroshava') && !form.unionId && !form.unionName) {
      toast.error('ইউনিয়ন নির্বাচন করুন বা ইউনিয়নের নাম লিখুন।');
      return;
    }

    if (form.areaType === 'pouroshava' && !form.wardNumber) {
      toast.error('পৌরসভার হাসপাতালের জন্য ওয়ার্ড নম্বর দিন।');
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

      toast.success('হাসপাতাল তৈরি হয়েছে।');
      resetForm();
      await loadHospitals();
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'হাসপাতাল তৈরি করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">হাসপাতাল ব্যবস্থাপনা</p>
        <h2>হাসপাতাল</h2>
        <p className="role-scope">
          {ROLE_LABEL[user?.role] || 'অ্যাডমিন'} নিজ অনুমোদিত এলাকার হাসপাতাল পরিচালনা করতে পারবেন।
        </p>
      </header>

      <article className="panel-card role-management-section">
        <h3>হাসপাতাল যোগ করুন</h3>
        <form className="profile-form-grid" onSubmit={submitHospital}>
          <div className="home-filter-field">
            <label htmlFor="hospitalName">হাসপাতালের নাম</label>
            <input id="hospitalName" value={form.name} onChange={handleChange('name')} />
          </div>

          <div className="home-filter-field">
            <label htmlFor="hospitalPhone">মোবাইল</label>
            <input id="hospitalPhone" value={form.phone} onChange={handleChange('phone')} />
          </div>

          <div className="home-filter-field profile-full-width">
            <label htmlFor="hospitalAddress">ঠিকানা</label>
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
              {isSubmitting ? 'তৈরি হচ্ছে...' : 'হাসপাতাল তৈরি করুন'}
            </button>
          </div>
        </form>
      </article>

      <article className="panel-card role-management-section">
        <h3>হাসপাতাল তালিকা</h3>
        {isLoading ? <p className="muted-text">হাসপাতাল লোড হচ্ছে...</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <div className="table-card role-management-table-card">
          <table>
            <thead>
              <tr>
                <th>নাম</th>
                <th>লোকেশন</th>
                <th>ঠিকানা</th>
                <th>মোবাইল</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital) => (
                <tr key={hospital.id}>
                  <td data-label="নাম">{hospital.name}</td>
                  <td data-label="লোকেশন">
                    {[hospital.locationNames?.division, hospital.locationNames?.district, hospital.locationNames?.upazila, hospital.locationNames?.union, hospital.locationNames?.wardNumber]
                      .filter(Boolean)
                      .join(' / ') || 'উল্লেখ নেই'}
                  </td>
                  <td data-label="ঠিকানা">{hospital.address || 'উল্লেখ নেই'}</td>
                  <td data-label="মোবাইল">{hospital.phone || 'উল্লেখ নেই'}</td>
                </tr>
              ))}
              {!isLoading && hospitals.length === 0 ? (
                <tr>
                  <td colSpan={4}>কোনো হাসপাতাল পাওয়া যায়নি।</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {meta ? (
          <p className="auth-switch">
            মোট {Number(meta.total || 0).toLocaleString('bn-BD')}টির মধ্যে {hospitals.length.toLocaleString('bn-BD')}টি দেখানো হচ্ছে
          </p>
        ) : null}
      </article>
    </section>
  );
};
