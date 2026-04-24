import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { userService } from '../../../services/userService.js';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { patientService } from '../../patients/services/patientService.js';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STATUS_LABELS = {
  pending: 'অপেক্ষমাণ',
  in_progress: 'চলমান',
  fulfilled: 'সম্পন্ন',
  cancelled: 'বাতিল',
};

const ROLE_LABELS = {
  union_leader: 'ইউনিয়ন দায়িত্বশীল',
  ward_admin: 'ওয়ার্ড অ্যাডমিন',
};

const formatDate = (value) => {
  if (!value) {
    return 'তারিখ দেওয়া নেই';
  }

  return new Date(value).toLocaleDateString('bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildLocationLine = (item) =>
  [
    item.locationNames?.division,
    item.locationNames?.district,
    item.locationNames?.upazila,
    item.locationNames?.union,
    item.locationNames?.area,
  ]
    .filter(Boolean)
    .join(' / ') || 'লোকেশন দেওয়া নেই';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
  const [locationFilters, setLocationFilters] = useState({
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
  });
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [bloodNeeds, setBloodNeeds] = useState([]);
  const [localAdmins, setLocalAdmins] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const filters = useMemo(
    () => ({
      bloodGroup,
      status,
      divisionId: locationFilters.divisionId,
      districtId: locationFilters.districtId,
      upazilaId: locationFilters.upazilaId,
      unionId: locationFilters.unionId,
      page: 1,
      limit: 20,
    }),
    [
      bloodGroup,
      status,
      locationFilters.divisionId,
      locationFilters.districtId,
      locationFilters.upazilaId,
      locationFilters.unionId,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const [patientResult, adminResult] = await Promise.all([
          patientService.list(filters),
          userService.getPublicLocalAdmins(locationFilters),
        ]);

        setBloodNeeds(patientResult.data);
        setMeta(patientResult.meta);
        setLocalAdmins(adminResult);
      } catch (requestError) {
        toast.error(requestError?.response?.data?.message || 'তথ্য লোড করা যায়নি।');
        setBloodNeeds([]);
        setLocalAdmins([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, locationFilters]);

  const clearFilters = () => {
    setBloodGroup('');
    setStatus('');
    setLocationFilters({
      divisionId: '',
      districtId: '',
      upazilaId: '',
      unionId: '',
    });
    setLocationResetKey((previous) => previous + 1);
  };

  return (
    <section className="feature-page reveal home-page-stack public-home">
      <header className="feature-header public-home-header">
        <div>
          <p className="eyebrow">বাংলা ব্লাড</p>
          <h2>রক্তের প্রয়োজনের পাবলিক তালিকা</h2>
          <p className="muted-text">
            যাদের রক্ত প্রয়োজন তাদের তথ্য সবাই দেখতে পারবে। রক্তদাতাদের তালিকা শুধু দায়িত্বশীল
            অ্যাডমিনদের জন্য সংরক্ষিত।
          </p>
        </div>
        <div className="public-home-actions">
          <Link to="/patients" className="inline-link-btn">
            রক্তের অনুরোধ দিন
          </Link>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="inline-link-btn">
            {isAuthenticated ? 'ড্যাশবোর্ড' : 'লগইন'}
          </Link>
        </div>
      </header>

      <div className="toolbar patient-toolbar">
        <label htmlFor="homeBloodGroup">রক্তের গ্রুপ</label>
        <select id="homeBloodGroup" value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)}>
          <option value="">সব গ্রুপ</option>
          {BLOOD_GROUP_OPTIONS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <label htmlFor="homeStatus">অবস্থা</label>
        <select id="homeStatus" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">সব অবস্থা</option>
          <option value="pending">অপেক্ষমাণ</option>
          <option value="in_progress">চলমান</option>
          <option value="fulfilled">সম্পন্ন</option>
        </select>

        <button type="button" className="inline-link-btn" onClick={clearFilters}>
          ফিল্টার মুছুন
        </button>
      </div>

      <LocationSelector
        mode="filter"
        idPrefix="publicHome"
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

      {isLoading ? <p className="page-loader">তালিকা লোড হচ্ছে...</p> : null}

      <div className="table-card patient-table-card">
        <table>
          <thead>
            <tr>
              <th>রোগী</th>
              <th>রক্তের গ্রুপ</th>
              <th>ব্যাগ</th>
              <th>হাসপাতাল</th>
              <th>লোকেশন</th>
              <th>তারিখ</th>
              <th>অবস্থা</th>
              <th>যোগাযোগ</th>
            </tr>
          </thead>
          <tbody>
            {bloodNeeds.map((patient) => (
              <tr key={patient.id}>
                <td data-label="রোগী">{patient.patientName}</td>
                <td data-label="রক্তের গ্রুপ">{patient.bloodGroup}</td>
                <td data-label="ব্যাগ">
                  {patient.unitsReceived}/{patient.unitsRequired}
                </td>
                <td data-label="হাসপাতাল">{patient.hospital?.name || patient.hospitalName || 'উল্লেখ নেই'}</td>
                <td data-label="লোকেশন">{buildLocationLine(patient)}</td>
                <td data-label="তারিখ">{formatDate(patient.requiredDate)}</td>
                <td data-label="অবস্থা">
                  <span className={`status-chip ${patient.status}`}>{STATUS_LABELS[patient.status] || patient.status}</span>
                </td>
                <td data-label="যোগাযোগ">{patient.contactPhone || 'উল্লেখ নেই'}</td>
              </tr>
            ))}
            {!isLoading && bloodNeeds.length === 0 ? (
              <tr>
                <td colSpan={8}>এই ফিল্টারে কোনো রক্তের অনুরোধ পাওয়া যায়নি।</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <p className="auth-switch">
          মোট {Number(meta.total || 0).toLocaleString('bn-BD')}টি অনুরোধের মধ্যে {bloodNeeds.length.toLocaleString('bn-BD')}টি দেখানো হচ্ছে
        </p>
      ) : null}

      <section className="table-card patient-table-card">
        <header className="panel-card-header">
          <h3>ইউনিয়ন দায়িত্বশীল ও ওয়ার্ড অ্যাডমিনের নম্বর</h3>
          <p className="muted-text">একই এলাকার জরুরি প্রয়োজনে সরাসরি যোগাযোগ করা যাবে।</p>
        </header>
        <table>
          <thead>
            <tr>
              <th>নাম</th>
              <th>দায়িত্ব</th>
              <th>এলাকা</th>
              <th>মোবাইল</th>
            </tr>
          </thead>
          <tbody>
            {localAdmins.map((admin) => (
              <tr key={admin.id}>
                <td data-label="নাম">{admin.name}</td>
                <td data-label="দায়িত্ব">{ROLE_LABELS[admin.role] || admin.roleLabel || admin.role}</td>
                <td data-label="এলাকা">
                  {[
                    admin.locationNames?.district,
                    admin.locationNames?.upazila,
                    admin.locationNames?.union,
                    admin.wardNumber ? `ওয়ার্ড ${admin.wardNumber}` : null,
                  ]
                    .filter(Boolean)
                    .join(' / ') || 'এলাকা দেওয়া নেই'}
                </td>
                <td data-label="মোবাইল">{admin.phone}</td>
              </tr>
            ))}
            {!isLoading && localAdmins.length === 0 ? (
              <tr>
                <td colSpan={4}>এই এলাকার কোনো প্রকাশ্য দায়িত্বশীল নম্বর পাওয়া যায়নি।</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </section>
  );
};

export default HomePage;
