import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { patientService } from '../services/patientService.js';

const STATUS_OPTIONS = ['pending', 'in_progress', 'fulfilled', 'cancelled'];
const MEDICAL_CONDITION_OPTIONS = [
  { value: 'none', label: 'One-time need' },
  { value: 'thalassemia', label: 'Thalassemia (regular blood needed)' },
  { value: 'other_regular', label: 'Other regular blood need' },
];

export const PatientListPage = () => {
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

  const searchFilters = useMemo(
    () => ({
      patientName,
      bloodGroup,
      status,
      divisionId: locationFilters.divisionId,
      districtId: locationFilters.districtId,
      upazilaId: locationFilters.upazilaId,
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
    ],
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
        const errorMessage = requestError?.response?.data?.message || 'Failed to load patients.';
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
  }, [createLocation.divisionId, createLocation.districtId, createLocation.upazilaId]);

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
      toast.error('Please fill required patient fields.');
      return;
    }

    if (!createLocation.divisionId || !createLocation.districtId || !createLocation.upazilaId) {
      toast.error('Please select division, district, and upazila.');
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

      toast.success('Patient added successfully.');
      resetCreateForm();
      setIsCreateOpen(false);

      const response = await patientService.list(searchFilters);
      setResults(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || 'Failed to add patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="feature-page reveal patient-page">
      <header className="feature-header">
        <p className="eyebrow">Patient Directory</p>
        <h2>Patient List</h2>
        <button type="button" className="inline-link-btn" onClick={() => setIsCreateOpen((prev) => !prev)}>
          {isCreateOpen ? 'Close Add Patient' : 'Add Patient'}
        </button>
      </header>

      {isCreateOpen ? (
        <form className="table-card patient-create-card" onSubmit={submitCreatePatient}>
          <h3>Add Patient</h3>

          <div className="toolbar patient-toolbar">
            <label htmlFor="newPatientName">Patient Name</label>
            <input
              id="newPatientName"
              value={createForm.patientName}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, patientName: event.target.value }))}
              placeholder="Patient full name"
            />

            <label htmlFor="newPatientAge">Age</label>
            <input
              id="newPatientAge"
              type="number"
              min="0"
              max="150"
              value={createForm.patientAge}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, patientAge: event.target.value }))}
            />

            <label htmlFor="newBloodGroup">Blood Group</label>
            <select
              id="newBloodGroup"
              value={createForm.bloodGroup}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            <label htmlFor="newUnitsRequired">Units Required</label>
            <input
              id="newUnitsRequired"
              type="number"
              min="1"
              value={createForm.unitsRequired}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, unitsRequired: event.target.value }))}
            />

            <label htmlFor="newHospital">Hospital</label>
            <select
              id="newHospital"
              value={createForm.hospitalId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, hospitalId: event.target.value }))}
            >
              <option value="">Select hospital</option>
              {hospitalOptions.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>

            <label htmlFor="newUrgency">Urgency</label>
            <select
              id="newUrgency"
              value={createForm.urgencyLevel}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, urgencyLevel: event.target.value }))}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>

            <label htmlFor="newContactPhone">Contact Phone</label>
            <input
              id="newContactPhone"
              value={createForm.contactPhone}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              placeholder="01XXXXXXXXX"
            />

            <label htmlFor="newContactPerson">Contact Person</label>
            <input
              id="newContactPerson"
              value={createForm.contactPerson}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
            />

            <label htmlFor="newRequiredDate">Required Date</label>
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
            <label htmlFor="newNeedsRegularBlood">Regular Blood Need</label>
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

            <label htmlFor="newMedicalCondition">Condition</label>
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

            <label htmlFor="newDescription">Description</label>
            <input
              id="newDescription"
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            />

            <label htmlFor="newNotes">Notes</label>
            <input
              id="newNotes"
              value={createForm.notes}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
            />

            <button type="submit" className="inline-link-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Submit Patient'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="toolbar patient-toolbar">
        <label htmlFor="patientName">Patient Name</label>
        <input
          id="patientName"
          value={patientName}
          onChange={(event) => setPatientName(event.target.value)}
          placeholder="Search by patient name"
        />

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

        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="button" className="inline-link-btn" onClick={clearFilters}>
          Clear Filters
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
      {isLoading ? <p className="page-loader">Loading patients...</p> : null}

      <div className="table-card patient-table-card">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Blood Group</th>
              <th>Need</th>
              <th>Hospital</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.patientName}</td>
                <td>{patient.bloodGroup}</td>
                <td>{patient.unitsReceived}/{patient.unitsRequired}</td>
                <td>{patient.hospital?.name || patient.hospitalName || 'N/A'}</td>
                <td>
                  {[
                    patient.locationNames?.division,
                    patient.locationNames?.district,
                    patient.locationNames?.upazila,
                    patient.locationNames?.union,
                    patient.locationNames?.area,
                  ]
                    .filter(Boolean)
                    .join(' / ') || 'N/A'}
                </td>
                <td>
                  <span className={`status-chip ${patient.status}`}>{patient.status}</span>
                </td>
              </tr>
            ))}
            {!isLoading && results.length === 0 ? (
              <tr>
                <td colSpan={6}>No patients found for selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {meta ? (
        <p className="auth-switch">
          Showing {results.length} of {meta.total} patients
        </p>
      ) : null}
    </section>
  );
};
