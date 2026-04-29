import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Phone, Share2 } from 'lucide-react';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { saveLastUsedLocation } from '../../../utils/locationMemory.js';
import { patientService } from '../services/patientService.js';

const STATUS_OPTIONS = ['pending', 'in_progress', 'fulfilled', 'cancelled'];
const STATUS_LABELS = {
  pending: 'অপেক্ষমাণ',
  in_progress: 'চলমান',
  fulfilled: 'সম্পন্ন',
  cancelled: 'বাতিল',
};
const URGENCY_LABELS = {
  low: 'কম',
  medium: 'মাঝারি',
  high: 'জরুরি',
  critical: 'অতি জরুরি',
};
const MEDICAL_CONDITION_OPTIONS = [
  { value: 'none', label: 'একবারের প্রয়োজন' },
  { value: 'thalassemia', label: 'থ্যালাসেমিয়া (নিয়মিত রক্ত লাগে)' },
  { value: 'other_regular', label: 'অন্যান্য নিয়মিত প্রয়োজন' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const normalizeBangladeshPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return digits;
};

const buildLocationLine = (patient) =>
  [
    patient.locationNames?.division,
    patient.locationNames?.district,
    patient.locationNames?.upazila,
    patient.locationNames?.union,
    patient.locationNames?.area,
  ]
    .filter(Boolean)
    .join(' / ') || 'উল্লেখ নেই';

const buildPatientShareText = (patient) =>
  `${patient.patientName || 'একজন রোগী'} এর জন্য ${patient.bloodGroup || ''} রক্ত প্রয়োজন। লোকেশন: ${buildLocationLine(patient)}। যোগাযোগ: ${patient.contactPhone || 'উল্লেখ নেই'}`;

export const PatientListPage = () => {
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationFilters, setLocationFilters] = useState({ divisionId: '', districtId: '', upazilaId: '', unionId: '' });
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [formLocationResetKey, setFormLocationResetKey] = useState(0);
  const [createForm, setCreateForm] = useState({
    patientName: '',
    patientAge: '',
    bloodGroup: '',
    unitsRequired: '1',
    hospitalId: '',
    hospitalName: '',
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
    [patientName, bloodGroup, status, locationFilters],
  );

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await patientService.list(searchFilters);
        setResults(response.data);
        setMeta(response.meta);
      } catch (requestError) {
        const message = requestError?.response?.data?.message || 'তালিকা লোড করা যায়নি।';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchFilters]);

  useEffect(() => {
    const loadHospitals = async () => {
      if (!isCreateOpen) {
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
  }, [createLocation.divisionId, createLocation.districtId, createLocation.upazilaId, isCreateOpen]);

  const clearFilters = () => {
    setPatientName('');
    setBloodGroup('');
    setStatus('');
    setLocationFilters({ divisionId: '', districtId: '', upazilaId: '', unionId: '' });
    setLocationResetKey((previous) => previous + 1);
  };

  const resetCreateForm = () => {
    setCreateForm({
      patientName: '',
      patientAge: '',
      bloodGroup: '',
      unitsRequired: '1',
      hospitalId: '',
      hospitalName: '',
      urgencyLevel: 'medium',
      contactPhone: '',
      contactPerson: '',
      requiredDate: '',
      description: '',
      notes: '',
      needsRegularBlood: false,
      medicalCondition: 'none',
    });
    setCreateLocation({ divisionId: '', districtId: '', upazilaId: '', unionId: '', areaName: '' });
    setFormLocationResetKey((previous) => previous + 1);
  };

  const closeCreateDialog = () => {
    if (!isSubmitting) {
      setIsCreateOpen(false);
    }
  };

  const closeFilterDialog = () => {
    setIsFilterOpen(false);
  };

  const clearAndKeepFilterDialog = () => {
    clearFilters();
  };

  const handleSharePatient = async (patient) => {
    const shareText = buildPatientShareText(patient);
    const shareUrl = `${window.location.origin}/patients/${patient.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'রক্ত প্রয়োজন', text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('শেয়ার তথ্য কপি হয়েছে।');
    } catch {
      toast.error('শেয়ার করা যায়নি।');
    }
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
        hospitalName: !createForm.hospitalId && createForm.hospitalName.trim() ? createForm.hospitalName.trim() : undefined,
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
      <header className="feature-header">
        <div>
          <p className="eyebrow">রক্তের প্রয়োজন</p>
          <h2>রোগী ও রক্তের অনুরোধের তালিকা</h2>
        </div>
        <div className="patient-row-actions">
          <button type="button" className="inline-link-btn ghost-action" onClick={() => setIsFilterOpen(true)}>
            Filter
          </button>
          <button type="button" className="inline-link-btn" onClick={() => setIsCreateOpen(true)}>
            রক্তের অনুরোধ দিন
          </button>
        </div>
      </header>

      {isFilterOpen ? (
        <div className="filter-dialog-backdrop" role="presentation" onMouseDown={closeFilterDialog}>
          <section
            className="filter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patientFilterDialogTitle"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="filter-dialog-header">
              <div>
                <p className="eyebrow">Filter</p>
                <h3 id="patientFilterDialogTitle">রক্তের অনুরোধ খুঁজুন</h3>
              </div>
              <button type="button" className="filter-dialog-close" aria-label="Close filter dialog" onClick={closeFilterDialog}>
                ×
              </button>
            </div>

            <div className="filter-dialog-form">
              <div className="filter-dialog-grid">
                <label htmlFor="patientName">রোগীর নাম</label>
                <input id="patientName" value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="রোগীর নামে খুঁজুন" />

                <label htmlFor="bloodGroup">রক্তের গ্রুপ</label>
                <select id="bloodGroup" value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)}>
                  <option value="">সব</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>

                <label htmlFor="status">অবস্থা</label>
                <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">সব</option>
                  {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{STATUS_LABELS[item] || item}</option>)}
                </select>
              </div>

              <LocationSelector
                mode="filter"
                idPrefix="patientList"
                resetKey={locationResetKey}
                enableAutoDetect={false}
                onChange={(value) => setLocationFilters({ divisionId: value.divisionId, districtId: value.districtId, upazilaId: value.upazilaId, unionId: value.unionId })}
              />

              <div className="filter-dialog-actions">
                <button type="button" className="inline-link-btn ghost-action" onClick={clearAndKeepFilterDialog}>ফিল্টার মুছুন</button>
                <button type="button" className="inline-link-btn" onClick={closeFilterDialog}>Apply Filter</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateOpen ? (
        <div className="request-dialog-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
          <section
            className="request-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="requestDialogTitle"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="request-dialog-header">
              <div>
                <p className="eyebrow">Public request</p>
                <h3 id="requestDialogTitle">রক্তের অনুরোধ দিন</h3>
                <p className="muted-text">লগিন ছাড়াই জরুরি রক্তের অনুরোধ পাঠানো যাবে।</p>
              </div>
              <button type="button" className="request-dialog-close" aria-label="Close request dialog" onClick={closeCreateDialog} disabled={isSubmitting}>
                ×
              </button>
            </div>

            <form className="request-dialog-form" onSubmit={submitCreatePatient}>
              <div className="request-dialog-grid">
                <label htmlFor="newPatientName">রোগীর নাম</label>
                <input id="newPatientName" value={createForm.patientName} onChange={(event) => setCreateForm((previous) => ({ ...previous, patientName: event.target.value }))} placeholder="রোগীর পূর্ণ নাম" />

                <label htmlFor="newPatientAge">বয়স</label>
                <input id="newPatientAge" type="number" min="0" max="150" value={createForm.patientAge} onChange={(event) => setCreateForm((previous) => ({ ...previous, patientAge: event.target.value }))} />

                <label htmlFor="newBloodGroup">রক্তের গ্রুপ</label>
                <select id="newBloodGroup" value={createForm.bloodGroup} onChange={(event) => setCreateForm((previous) => ({ ...previous, bloodGroup: event.target.value }))}>
                  <option value="">নির্বাচন করুন</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>

                <label htmlFor="newUnitsRequired">ব্যাগ প্রয়োজন</label>
                <input id="newUnitsRequired" type="number" min="1" value={createForm.unitsRequired} onChange={(event) => setCreateForm((previous) => ({ ...previous, unitsRequired: event.target.value }))} />

                <label htmlFor="newHospital">হাসপাতাল সিলেক্ট করুন</label>
                <select
                  id="newHospital"
                  value={createForm.hospitalId}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, hospitalId: event.target.value, hospitalName: event.target.value ? '' : previous.hospitalName }))}
                >
                  <option value="">লিস্টে না থাকলে নিচে লিখুন</option>
                  {hospitalOptions.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
                </select>

                <label htmlFor="newHospitalName">হাসপাতালের নাম</label>
                <input
                  id="newHospitalName"
                  value={createForm.hospitalName}
                  disabled={Boolean(createForm.hospitalId)}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, hospitalName: event.target.value }))}
                  placeholder={createForm.hospitalId ? 'হাসপাতাল select করা হয়েছে' : 'লিস্টে না থাকলে হাসপাতালের নাম লিখুন'}
                />

                <label htmlFor="newUrgency">জরুরিতা</label>
                <select id="newUrgency" value={createForm.urgencyLevel} onChange={(event) => setCreateForm((previous) => ({ ...previous, urgencyLevel: event.target.value }))}>
                  <option value="low">কম</option>
                  <option value="medium">মাঝারি</option>
                  <option value="high">জরুরি</option>
                  <option value="critical">অতি জরুরি</option>
                </select>

                <label htmlFor="newContactPhone">যোগাযোগ নম্বর</label>
                <input id="newContactPhone" value={createForm.contactPhone} onChange={(event) => setCreateForm((previous) => ({ ...previous, contactPhone: event.target.value }))} placeholder="01XXXXXXXXX" />

                <label htmlFor="newContactPerson">যোগাযোগের ব্যক্তি</label>
                <input id="newContactPerson" value={createForm.contactPerson} onChange={(event) => setCreateForm((previous) => ({ ...previous, contactPerson: event.target.value }))} />

                <label htmlFor="newRequiredDate">প্রয়োজনের তারিখ</label>
                <input id="newRequiredDate" type="date" value={createForm.requiredDate} onChange={(event) => setCreateForm((previous) => ({ ...previous, requiredDate: event.target.value }))} />
              </div>

              <LocationSelector
                mode="required"
                idPrefix="patientCreate"
                resetKey={formLocationResetKey}
                enableAutoDetect={true}
                onChange={(value) => {
                  const nextLocation = {
                    divisionId: value.divisionId,
                    districtId: value.districtId,
                    upazilaId: value.upazilaId,
                    unionId: value.unionId,
                    areaName: value.locationNames?.union || value.unionName || '',
                  };
                  setCreateLocation(nextLocation);
                  if (nextLocation.divisionId && nextLocation.districtId && nextLocation.upazilaId) {
                    saveLastUsedLocation(nextLocation);
                  }
                }}
              />

              <div className="request-dialog-grid request-dialog-grid-secondary">
                <label htmlFor="newNeedsRegularBlood">নিয়মিত রক্ত লাগে</label>
                <input id="newNeedsRegularBlood" type="checkbox" checked={createForm.needsRegularBlood} onChange={(event) => setCreateForm((previous) => ({ ...previous, needsRegularBlood: event.target.checked, medicalCondition: event.target.checked ? previous.medicalCondition : 'none' }))} />

                <label htmlFor="newMedicalCondition">অবস্থা</label>
                <select id="newMedicalCondition" value={createForm.medicalCondition} onChange={(event) => setCreateForm((previous) => ({ ...previous, medicalCondition: event.target.value }))} disabled={!createForm.needsRegularBlood}>
                  {MEDICAL_CONDITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>

                <label htmlFor="newDescription">বিবরণ</label>
                <input id="newDescription" value={createForm.description} onChange={(event) => setCreateForm((previous) => ({ ...previous, description: event.target.value }))} />

                <label htmlFor="newNotes">নোট</label>
                <input id="newNotes" value={createForm.notes} onChange={(event) => setCreateForm((previous) => ({ ...previous, notes: event.target.value }))} />
              </div>

              <div className="request-dialog-actions">
                <button type="button" className="inline-link-btn ghost-action" onClick={closeCreateDialog} disabled={isSubmitting}>বন্ধ করুন</button>
                <button type="submit" className="inline-link-btn" disabled={isSubmitting}>{isSubmitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <div className="public-banner">🔴 জরুরি রক্তের অনুরোধ — সবাই দেখতে পারবেন, সবাই অনুরোধ করতে পারবেন</div>

      {error ? <p className="auth-error">{error}</p> : null}
      {isLoading ? <p className="page-loader">তালিকা লোড হচ্ছে...</p> : null}

      <div className="table-card patient-table-card">
        <table>
          <thead>
            <tr>
              <th>রোগী</th>
              <th>রক্তের গ্রুপ</th>
              <th>জরুরিতা</th>
              <th>ব্যাগ</th>
              <th>হাসপাতাল</th>
              <th>লোকেশন</th>
              <th>অবস্থা</th>
              <th>যোগাযোগ</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {results.map((patient) => {
              const normalizedPhone = normalizeBangladeshPhone(patient.contactPhone);
              const whatsappUrl = normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildPatientShareText(patient))}` : '';

              return (
                <tr key={patient.id}>
                  <td data-label="রোগী"><Link to={`/patients/${patient.id}`}>{patient.patientName}</Link></td>
                  <td data-label="রক্তের গ্রুপ">{patient.bloodGroup}</td>
                  <td data-label="জরুরিতা"><span className={`status-chip ${patient.urgencyLevel || 'medium'}`}>{URGENCY_LABELS[patient.urgencyLevel] || 'মাঝারি'}</span></td>
                  <td data-label="ব্যাগ">{patient.unitsReceived}/{patient.unitsRequired}</td>
                  <td data-label="হাসপাতাল">{patient.hospital?.name || patient.hospitalName || 'উল্লেখ নেই'}</td>
                  <td data-label="লোকেশন">{buildLocationLine(patient)}</td>
                  <td data-label="অবস্থা"><span className={`status-chip ${patient.status}`}>{STATUS_LABELS[patient.status] || patient.status}</span></td>
                  <td data-label="যোগাযোগ">{patient.contactPhone ? <a className="inline-link-btn" href={`tel:${patient.contactPhone}`}><Phone size={14} /> কল</a> : 'উল্লেখ নেই'}</td>
                  <td data-label="অ্যাকশন">
                    <div className="patient-row-actions">
                      <Link className="inline-link-btn" to={`/patients/${patient.id}`}>বিস্তারিত</Link>
                      {whatsappUrl ? <a className="inline-link-btn" href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a> : null}
                      <button type="button" className="inline-link-btn" onClick={() => handleSharePatient(patient)}><Share2 size={14} /> শেয়ার</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && results.length === 0 ? (
              <tr><td colSpan={9}>এই ফিল্টারে কোনো অনুরোধ পাওয়া যায়নি।</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? <p className="auth-switch">মোট {Number(meta.total || 0).toLocaleString('bn-BD')}টি অনুরোধের মধ্যে {results.length.toLocaleString('bn-BD')}টি দেখানো হচ্ছে</p> : null}
    </section>
  );
};

export default PatientListPage;
