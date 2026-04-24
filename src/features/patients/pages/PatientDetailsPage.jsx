import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { Phone, Share2 } from 'lucide-react';

import { patientService } from '../services/patientService.js';

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

const CONDITION_LABELS = {
  none: 'একবারের প্রয়োজন',
  thalassemia: 'থ্যালাসেমিয়া',
  other_regular: 'অন্যান্য নিয়মিত প্রয়োজন',
};

const normalizeBangladeshPhone = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');

  if (digits.startsWith('880')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `88${digits}`;
  }

  return digits;
};

const formatDate = (value) => {
  if (!value) {
    return 'উল্লেখ নেই';
  }

  return new Date(value).toLocaleDateString('bn-BD', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const buildLocationLine = (patient) =>
  [
    patient?.locationNames?.division,
    patient?.locationNames?.district,
    patient?.locationNames?.upazila,
    patient?.locationNames?.union,
    patient?.locationNames?.area,
  ]
    .filter(Boolean)
    .join(' / ') || 'লোকেশন উল্লেখ নেই';

const buildShareText = (patient) => {
  return `${patient?.patientName || 'একজন রোগী'} এর জন্য ${patient?.bloodGroup || ''} রক্ত প্রয়োজন।\nজরুরিতা: ${URGENCY_LABELS[patient?.urgencyLevel] || 'মাঝারি'}\nলোকেশন: ${buildLocationLine(patient)}\nযোগাযোগ: ${patient?.contactPhone || 'উল্লেখ নেই'}`;
};

export const PatientDetailsPage = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadPatient = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await patientService.getById(id);
        if (isMounted) {
          setPatient(data);
        }
      } catch (requestError) {
        if (isMounted) {
          const message = requestError?.response?.data?.message || 'রোগীর তথ্য লোড করা যায়নি।';
          setError(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPatient();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const normalizedPhone = normalizeBangladeshPhone(patient?.contactPhone);
  const shareUrl = useMemo(() => `${window.location.origin}/patients/${id}`, [id]);
  const shareText = patient ? buildShareText(patient) : '';
  const whatsappUrl = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
    : '';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'রক্ত প্রয়োজন',
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('শেয়ার তথ্য কপি হয়েছে।');
    } catch {
      toast.error('শেয়ার করা যায়নি।');
    }
  };

  if (isLoading) {
    return <p className="page-loader">রোগীর তথ্য লোড হচ্ছে...</p>;
  }

  if (error || !patient) {
    return (
      <section className="feature-page reveal patient-page">
        <div className="table-card">
          <p className="auth-error">{error || 'রোগীর তথ্য পাওয়া যায়নি।'}</p>
          <Link to="/patients" className="inline-link-btn">
            তালিকায় ফিরে যান
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="feature-page reveal patient-page">
      <header className="feature-header">
        <p className="eyebrow">রক্তের অনুরোধ</p>
        <h2>{patient.patientName}</h2>
        <Link to="/patients" className="inline-link-btn">
          তালিকায় ফিরে যান
        </Link>
      </header>

      <div className="panel-grid dashboard-grid">
        <article className="panel-card">
          <h3>মূল তথ্য</h3>
          <ul className="list-clean">
            <li><strong>রক্তের গ্রুপ:</strong> {patient.bloodGroup}</li>
            <li><strong>বয়স:</strong> {patient.patientAge || 'উল্লেখ নেই'}</li>
            <li><strong>প্রয়োজনীয় ব্যাগ:</strong> {patient.unitsReceived || 0}/{patient.unitsRequired || 1}</li>
            <li><strong>প্রয়োজনের তারিখ:</strong> {formatDate(patient.requiredDate)}</li>
          </ul>
          <div className="patient-row-actions">
            <span className={`status-chip ${patient.urgencyLevel || 'medium'}`}>
              {URGENCY_LABELS[patient.urgencyLevel] || 'মাঝারি'}
            </span>
            <span className={`status-chip ${patient.status}`}>
              {STATUS_LABELS[patient.status] || patient.status}
            </span>
          </div>
        </article>

        <article className="panel-card">
          <h3>লোকেশন ও হাসপাতাল</h3>
          <ul className="list-clean">
            <li><strong>লোকেশন:</strong> {buildLocationLine(patient)}</li>
            <li><strong>হাসপাতাল:</strong> {patient.hospital?.name || patient.hospitalName || 'উল্লেখ নেই'}</li>
            <li><strong>ঠিকানা:</strong> {patient.hospital?.address || 'উল্লেখ নেই'}</li>
          </ul>
        </article>

        <article className="panel-card">
          <h3>যোগাযোগ</h3>
          <ul className="list-clean">
            <li><strong>ফোন:</strong> {patient.contactPhone || 'উল্লেখ নেই'}</li>
            <li><strong>যোগাযোগের ব্যক্তি:</strong> {patient.contactPerson || 'উল্লেখ নেই'}</li>
            <li><strong>অনুরোধকারী:</strong> {patient.requestedBy?.name || 'উল্লেখ নেই'}</li>
          </ul>
          <div className="patient-row-actions">
            {patient.contactPhone ? (
              <a className="inline-link-btn" href={`tel:${patient.contactPhone}`}>
                <Phone size={14} /> কল করুন
              </a>
            ) : null}
            {whatsappUrl ? (
              <a className="inline-link-btn" href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            ) : null}
            <button type="button" className="inline-link-btn" onClick={handleShare}>
              <Share2 size={14} /> শেয়ার
            </button>
          </div>
        </article>

        <article className="panel-card">
          <h3>অতিরিক্ত তথ্য</h3>
          <ul className="list-clean">
            <li><strong>প্রয়োজনের ধরন:</strong> {CONDITION_LABELS[patient.medicalCondition] || patient.medicalCondition}</li>
            <li><strong>নিয়মিত রক্ত লাগে:</strong> {patient.needsRegularBlood ? 'হ্যাঁ' : 'না'}</li>
            <li><strong>বিবরণ:</strong> {patient.description || 'উল্লেখ নেই'}</li>
            <li><strong>নোট:</strong> {patient.notes || 'উল্লেখ নেই'}</li>
          </ul>
        </article>
      </div>
    </section>
  );
};

export default PatientDetailsPage;
