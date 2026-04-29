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

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'তারিখ দেওয়া নেই';
  }

  return parsed.toLocaleDateString('bn-BD', {
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
  const [isDonorDialogOpen, setIsDonorDialogOpen] = useState(false);

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
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const [patientResult, adminResult] = await Promise.allSettled([
          patientService.list(filters),
          userService.getPublicLocalAdmins(locationFilters),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        if (patientResult.status === 'fulfilled') {
          setBloodNeeds(Array.isArray(patientResult.value?.data) ? patientResult.value.data : []);
          setMeta(patientResult.value?.meta || null);
        } else {
          setBloodNeeds([]);
          setMeta(null);
        }

        if (adminResult.status === 'fulfilled') {
          setLocalAdmins(Array.isArray(adminResult.value) ? adminResult.value : []);
        } else {
          setLocalAdmins([]);
        }

        if (patientResult.status === 'rejected' && adminResult.status === 'rejected') {
          toast.error('তথ্য লোড করা যায়নি।');
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          toast.error(requestError?.response?.data?.message || 'তথ্য লোড করা যায়নি।');
          setBloodNeeds([]);
          setLocalAdmins([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
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
    <section className="feature-page reveal home-page-stack public-home startup-home clean-home">
      <header className="clean-home-hero">
        <div className="blood-pulse-ring" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="clean-home-actions">
          <Link to="/patients" className="inline-link-btn startup-primary-cta">
            রক্তের অনুরোধ দিন
          </Link>
          <button type="button" className="inline-link-btn ghost-action" onClick={() => setIsDonorDialogOpen(true)}>
            ডোনার যোগ করুন
          </button>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="inline-link-btn ghost-action">
            {isAuthenticated ? 'ড্যাশবোর্ড' : 'লগইন'}
          </Link>
        </div>
      </header>

      <section className="table-card startup-filter-card">
        <header className="panel-card-header">
          <div>
            <p className="eyebrow">দ্রুত খুঁজুন</p>
            <h3>রক্তের অনুরোধ filter করুন</h3>
          </div>
          <button type="button" className="inline-link-btn" onClick={clearFilters}>
            ফিল্টার মুছুন
          </button>
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
      </section>

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

      {isDonorDialogOpen ? (
        <div className="donor-dialog-backdrop" role="presentation" onClick={() => setIsDonorDialogOpen(false)}>
          <section
            className="donor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addDonorDialogTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="donor-dialog-close" aria-label="Close donor dialog" onClick={() => setIsDonorDialogOpen(false)}>
              ×
            </button>
            <p className="eyebrow">Donor</p>
            <h2 id="addDonorDialogTitle">ডোনার হিসেবে যুক্ত হন</h2>
            <p className="muted-text">ডোনার profile তৈরি বা update করুন।</p>
            <div className="donor-dialog-actions">
              <Link to="/register" className="inline-link-btn startup-primary-cta">
                ডোনার রেজিস্টার
              </Link>
              <Link to={isAuthenticated ? '/profile' : '/login'} className="inline-link-btn ghost-action">
                {isAuthenticated ? 'প্রোফাইল আপডেট' : 'লগইন'}
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};

export default HomePage;
