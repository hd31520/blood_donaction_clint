import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import { donorSearchService } from '../../donors/services/donorSearchService.js';
import { patientService } from '../services/patientService.js';

const STATUS_OPTIONS = ['pending', 'in_progress', 'fulfilled', 'cancelled'];
const STATUS_LABELS = {
  pending: 'অপেক্ষমাণ',
  in_progress: 'চলমান',
  fulfilled: 'সম্পন্ন',
  cancelled: 'বাতিল',
};
const MEDICAL_CONDITION_OPTIONS = [
  { value: 'none', label: 'একবারের প্রয়োজন' },
  { value: 'thalassemia', label: 'থ্যালাসেমিয়া (নিয়মিত রক্ত লাগে)' },
  { value: 'other_regular', label: 'অন্যান্য নিয়মিত প্রয়োজন' },
];

const PUBLIC_PATIENT_NAV_LINKS = [
  { key: 'home', label: 'হোম', path: '/home' },
  { key: 'patients', label: 'রক্তের প্রয়োজন', path: '/patients' },
  { key: 'login', label: 'লগইন', path: '/login', guestOnly: true },
  { key: 'dashboard', label: 'ড্যাশবোর্ড', path: '/dashboard', authOnly: true },
];

export const PatientListPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [formLocationResetKey, setFormLocationResetKey] = useState(0);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    patientName: '',
    patientAge: '',
    bloodGroup: '',
    unitsRequired: '1',
    hospitalId: '',
    urgencyLevel: 'medium',
    contactPhone: '',
    contactPerson: '',
    requiredDate: '',
    description: '',
    notes: '',
    needsRegularBlood: false,
    medicalCondition: 'none',
  });
  const [createLocation, setCreateLocation] = useState({
    divisionId: '',
    districtId: '',
    upazilaId: '',
    unionId: '',
    areaName: '',
  });
  const [allowPatientChat, setAllowPatientChat] = useState(false);

  const canUsePatientChat = user?.role === 'donor' && allowPatientChat;
  const visiblePublicNavLinks = PUBLIC_PATIENT_NAV_LINKS.filter((link) => {
    if (link.authOnly) {
      return isAuthenticated;
    }

    if (link.guestOnly) {
      return !isAuthenticated;
    }

    return true;
  });

  const searchFilters = useMemo(
    () => ({
      patientName,
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
      patientName,
      bloodGroup,
      status,
      locationFilters.divisionId,
      locationFilters.districtId,
      locationFilters.upazilaId,
      locationFilters.unionId,
    ],
  );

  useEffect(() => {
    if (user?.role !== 'donor') {
      setAllowPatientChat(false);
      return;
    }

    let isMounted = true;

    const loadDonorChatPreference = async () => {
      try {
        const profile = await donorSearchService.getMyProfile();
        if (isMounted) {
          setAllowPatientChat(profile?.allowPatientChat !== false);
        }
      } catch {
        if (isMounted) {
          setAllowPatientChat(false);
        }
      }
    };

    loadDonorChatPreference();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await patientService.list(searchFilters);
        setResults(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        const errorMessage = requestError?.response?.data?.message || 'তালিকা লোড করা যায়নি।';
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

  useEffect(() => {
    const loadHospitals = async () => {
      if (!isAuthenticated || !isCreateOpen) {
        setHospitalOptions([]);
        return;
      }

      try {
        const data = await patientService.listHospitals({
          divisionId: createLocation.divisionId,
          districtId: createLocation.districtId,
          upazilaId: createLocation.upazilaId,
        });
        setHospitalOptions(data);
      } catch {
        setHospitalOptions([]);
      }
    };

    loadHospitals();
  }, [
    createLocation.divisionId,
    createLocation.districtId,
    createLocation.upazilaId,
    isAuthenticated,
    isCreateOpen,
  ]);

  const clearFilters = () => {
    setPatientName('');
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

  const resetCreateForm = () => {
    setCreateForm({
      patientName: '',
      patientAge: '',
      bloodGroup: '',
      unitsRequired: '1',
      hospitalId: '',
      urgencyLevel: 'medium',
      contactPhone: '',
      contactPerson: '',
      requiredDate: '',
      description: '',
      notes: '',
      needsRegularBlood: false,
      medicalCondition: 'none',
    });
    setCreateLocation({
      divisionId: '',
      districtId: '',
      upazilaId: '',
      unionId: '',
      areaName: '',
    });
    setFormLocationResetKey((previous) => previous + 1);
  };

  const submitCreatePatient = async (event) => {
    event.preventDefault();

    if (!createForm.patientName || !createForm.patientAge || !createForm.bloodGroup || !createForm.contactPhone || !createForm.requiredDate) {
      toast.error('রোগীর প্রয়োজনীয় তথ্য পূরণ করুন।');
      return;
    }

    if (!createLocation.divisionId || !createLocation.districtId || !createLocation.upazilaId) {
      toast.error('বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।');
      return;
    }

    try {
      setIsSubmitting(true);

      await patientService.create({
        patientName: createForm.patientName,
        patientAge: Number(createForm.patientAge),
        bloodGroup: createForm.bloodGroup,
        unitsRequired: Number(createForm.unitsRequired) || 1,
        hospital: createForm.hospitalId || undefined,
        location: {
          division: createLocation.divisionId,
          district: createLocation.districtId,
          upazila: createLocation.upazilaId,
          union: createLocation.unionId || undefined,
          area: createLocation.areaName || undefined,
        },
        urgencyLevel: createForm.urgencyLevel,
        contactPhone: createForm.contactPhone,
        contactPerson: createForm.contactPerson || undefined,
        requiredDate: createForm.requiredDate,
        description: createForm.description || undefined,
        notes: createForm.notes || undefined,
        needsRegularBlood: createForm.needsRegularBlood,
        medicalCondition: createForm.needsRegularBlood ? createForm.medicalCondition : 'none',
      });

      toast.success('রক্তের অনুরোধ পাঠানো হয়েছে।');
      resetCreateForm();
      setIsCreateOpen(false);

      const response = await patientService.list(searchFilters);
      setResults(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'রক্তের অনুরোধ পাঠানো যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="feature-page reveal patient-page">
      <header className="table-card patient-public-menu">
        <div className="panel-card-header">
          <div>
            <p className="eyebrow">বাংলা ব্লাড</p>
            <h3>রক্ত সহায়তা</h3>
          </div>
          <button
            type="button"
            className="mobile-menu-toggle inline-link-btn"
            aria-label={isPublicMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={isPublicMenuOpen}
            onClick={() => setIsPublicMenuOpen((previous) => !previous)}
          >
            {isPublicMenuOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{isPublicMenuOpen ? 'বন্ধ' : 'মেনু'}</span>
          </button>
        </div>

        {isPublicMenuOpen ? (
          <nav className="toolbar patient-toolbar" aria-label="Patients page navigation">
            {visiblePublicNavLinks.map((link) => (
              <NavLink
                key={link.key}
                to={link.path}
                className={({ isActive }) => `inline-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => setIsPublicMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>

      <header className="feature-header">
        <p className="eyebrow">রক্তের প্রয়োজন</p>
        <h2>রোগী ও রক্তের অনুরোধের তালিকা</h2>
        {isAuthenticated ? (
          <button type="button" className="inline-link-btn" onClick={() => setIsCreateOpen((prev) => !prev)}>
            {isCreateOpen ? 'ফর্ম বন্ধ করুন' : 'রক্তের অনুরোধ দিন'}
          </button>
        ) : (
          <Link to="/login" className="inline-link-btn">
            অনুরোধ দিতে লগইন করুন
          </Link>
        )}
      </header>

      {isAuthenticated && isCreateOpen ? (
        <form className="table-card patient-create-card" onSubmit={submitCreatePatient}>
          <h3>রক্তের অনুরোধ দিন</h3>

          <div className="toolbar patient-toolbar">
            <label htmlFor="newPatientName">রোগীর নাম</label>
            <input
              id="newPatientName"
              value={createForm.patientName}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, patientName: event.target.value }))}
              placeholder="রোগীর পূর্ণ নাম"
            />

            <label htmlFor="newPatientAge">বয়স</label>
            <input
              id="newPatientAge"
              type="number"
              min="0"
              max="150"
              value={createForm.patientAge}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, patientAge: event.target.value }))}
            />

            <label htmlFor="newBloodGroup">রক্তের গ্রুপ</label>
            <select
              id="newBloodGroup"
              value={createForm.bloodGroup}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
            >
              <option value="">নির্বাচন করুন</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            <label htmlFor="newUnitsRequired">ব্যাগ প্রয়োজন</label>
            <input
              id="newUnitsRequired"
              type="number"
              min="1"
              value={createForm.unitsRequired}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, unitsRequired: event.target.value }))}
            />

            <label htmlFor="newHospital">হাসপাতাল</label>
            <select
              id="newHospital"
              value={createForm.hospitalId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, hospitalId: event.target.value }))}
            >
              <option value="">হাসপাতাল নির্বাচন করুন</option>
              {hospitalOptions.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>

            <label htmlFor="newUrgency">জরুরিতা</label>
            <select
              id="newUrgency"
              value={createForm.urgencyLevel}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, urgencyLevel: event.target.value }))}
            >
              <option value="low">কম</option>
              <option value="medium">মাঝারি</option>
              <option value="high">জরুরি</option>
              <option value="critical">অতি জরুরি</option>
            </select>

            <label htmlFor="newContactPhone">যোগাযোগ নম্বর</label>
            <input
              id="newContactPhone"
              value={createForm.contactPhone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              placeholder="01XXXXXXXXX"
            />

            <label htmlFor="newContactPerson">যোগাযোগের ব্যক্তি</label>
            <input
              id="newContactPerson"
              value={createForm.contactPerson}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
            />

            <label htmlFor="newRequiredDate">প্রয়োজনের তারিখ</label>
            <input
              id="newRequiredDate"
              type="date"
              value={createForm.requiredDate}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, requiredDate: event.target.value }))}
            />
          </div>

          <LocationSelector
            mode="filter"
            idPrefix="patientCreate"
            resetKey={formLocationResetKey}
            enableAutoDetect={false}
            onChange={(value) => {
              setCreateLocation({
                divisionId: value.divisionId,
                districtId: value.districtId,
                upazilaId: value.upazilaId,
                unionId: value.unionId,
                areaName: value.locationNames?.union || '',
              });
            }}
          />

          <div className="toolbar patient-toolbar">
            <label htmlFor="newNeedsRegularBlood">নিয়মিত রক্ত লাগে</label>
            <input
              id="newNeedsRegularBlood"
              type="checkbox"
              checked={createForm.needsRegularBlood}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  needsRegularBlood: event.target.checked,
                  medicalCondition: event.target.checked ? prev.medicalCondition : 'none',
                }))
              }
            />

            <label htmlFor="newMedicalCondition">অবস্থা</label>
            <select
              id="newMedicalCondition"
              value={createForm.medicalCondition}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, medicalCondition: event.target.value }))}
              disabled={!createForm.needsRegularBlood}
            >
              {MEDICAL_CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label htmlFor="newDescription">বিবরণ</label>
            <input
              id="newDescription"
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            />

            <label htmlFor="newNotes">নোট</label>
            <input
              id="newNotes"
              value={createForm.notes}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
            />

            <button type="submit" className="inline-link-btn" disabled={isSubmitting}>
              {isSubmitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="toolbar patient-toolbar">
        <label htmlFor="patientName">রোগীর নাম</label>
        <input
          id="patientName"
          value={patientName}
          onChange={(event) => setPatientName(event.target.value)}
          placeholder="রোগীর নামে খুঁজুন"
        />

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

        <label htmlFor="status">অবস্থা</label>
        <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">সব</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item] || item}
            </option>
          ))}
        </select>

        <button type="button" className="inline-link-btn" onClick={clearFilters}>
          ফিল্টার মুছুন
        </button>
      </div>

      <LocationSelector
        mode="filter"
        idPrefix="patientList"
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
              <th>অবস্থা</th>
              <th>যোগাযোগ</th>
              <th>চ্যাট</th>
            </tr>
          </thead>
          <tbody>
            {results.map((patient) => (
              <tr key={patient.id}>
                <td data-label="রোগী">{patient.patientName}</td>
                <td data-label="রক্তের গ্রুপ">{patient.bloodGroup}</td>
                <td data-label="ব্যাগ">{patient.unitsReceived}/{patient.unitsRequired}</td>
                <td data-label="হাসপাতাল">{patient.hospital?.name || patient.hospitalName || 'উল্লেখ নেই'}</td>
                <td data-label="লোকেশন">
                  {[
                    patient.locationNames?.division,
                    patient.locationNames?.district,
                    patient.locationNames?.upazila,
                    patient.locationNames?.union,
                    patient.locationNames?.area,
                  ]
                    .filter(Boolean)
                    .join(' / ') || 'উল্লেখ নেই'}
                </td>
                <td data-label="অবস্থা">
                  <span className={`status-chip ${patient.status}`}>
                    {STATUS_LABELS[patient.status] || patient.status}
                  </span>
                </td>
                <td data-label="যোগাযোগ">{patient.contactPhone || 'উল্লেখ নেই'}</td>
                <td data-label="চ্যাট">
                  {canUsePatientChat && patient.requestedBy?.id ? (
                    <Link
                      className="inline-link-btn"
                      to={`/chat?targetUserId=${encodeURIComponent(String(patient.requestedBy.id))}&patientId=${encodeURIComponent(String(patient.id))}`}
                    >
                      চ্যাট
                    </Link>
                  ) : (
                    <span className="muted-text">চালু নেই</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && results.length === 0 ? (
              <tr>
                <td colSpan={8}>এই ফিল্টারে কোনো অনুরোধ পাওয়া যায়নি।</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <p className="auth-switch">
          মোট {Number(meta.total || 0).toLocaleString('bn-BD')}টি অনুরোধের মধ্যে {results.length.toLocaleString('bn-BD')}টি দেখানো হচ্ছে
        </p>
      ) : null}
    </section>
  );
};
