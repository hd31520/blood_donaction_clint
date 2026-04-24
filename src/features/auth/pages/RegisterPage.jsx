import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getAuthErrorMessage } from '../utils/authErrorMessage.js';
import { getRoleDefaultPath } from '../utils/roleRedirect.js';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bloodGroup: 'A+',
    role: 'donor',
    divisionId: '',
    districtId: '',
    upazilaId: '',
    areaType: '',
    unionId: '',
    unionName: '',
    wardNumber: '',
    phone: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setFormData((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleLocationChange = (locationData) => {
    setFormData((previous) => ({
      ...previous,
      ...locationData,
    }));
  };

  const hasCompleteLocation = Boolean(
    formData.divisionId &&
      formData.districtId &&
      formData.upazilaId &&
      formData.areaType &&
      (formData.unionId || formData.unionName) &&
      (formData.areaType === 'pouroshava' ? formData.wardNumber : true),
  );

  const getMissingLocationFields = () => {
    const missingFields = [];

    if (!formData.divisionId) {
      missingFields.push('বিভাগ');
    }
    if (!formData.districtId) {
      missingFields.push('জেলা');
    }
    if (!formData.upazilaId) {
      missingFields.push('উপজেলা');
    }
    if (!formData.areaType) {
      missingFields.push('এলাকার ধরন');
    }
    if (!formData.unionId) {
      if (!formData.unionName) {
        missingFields.push(formData.areaType === 'pouroshava' ? 'পৌরসভা' : 'ইউনিয়ন');
      }
    }

    if (formData.areaType === 'pouroshava' && !formData.wardNumber) {
      missingFields.push('ওয়ার্ড নম্বর');
    }

    return missingFields;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!hasCompleteLocation) {
      const missingLocationFields = getMissingLocationFields();
      const errorMessage = `প্রয়োজনীয় লোকেশন তথ্য নির্বাচন করুন: ${missingLocationFields.join(', ')}।`;
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register(formData);
      toast.success('নিবন্ধন সফল হয়েছে। স্বাগতম!');
      navigate(getRoleDefaultPath(user?.role), { replace: true });
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      const status = requestError?.response?.status;
      const hasResponse = Boolean(requestError?.response);
      const isTimeout = requestError?.code === 'ECONNABORTED';
      const errorMessage = getAuthErrorMessage({
        mode: 'register',
        status,
        serverMessage,
        hasResponse,
        isTimeout,
      });

      console.error('[AUTH_UI][REGISTER_FAILED]', {
        message: requestError?.message,
        status: requestError?.response?.status,
        response: requestError?.response?.data,
        payloadPreview: {
          email: formData.email,
          role: formData.role,
          divisionId: formData.divisionId,
          districtId: formData.districtId,
          upazilaId: formData.upazilaId,
          areaType: formData.areaType,
          hasUnionId: Boolean(formData.unionId),
          hasUnionName: Boolean(formData.unionName),
        },
      });

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page reveal">
      <article className="auth-card wide">
        <div className="auth-brand-row">
          <span className="auth-brand-mark">BB</span>
          <div>
            <p className="eyebrow">নতুন অ্যাকাউন্ট</p>
            <h2>রক্তদাতা বা সন্ধানকারী হিসেবে নিবন্ধন</h2>
          </div>
        </div>
        <p className="auth-subtitle">যাচাইকৃত লোকেশন ও নিরাপদ পরিচয় দিয়ে স্থানীয় রক্ত সহায়তা নেটওয়ার্কে যুক্ত হন।</p>

        <form onSubmit={handleSubmit} className="auth-form grid-two" aria-describedby={error ? 'registerError' : undefined}>
          <label htmlFor="registerName">পূর্ণ নাম</label>
          <input
            id="registerName"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            autoComplete="name"
            required
          />

          <label htmlFor="registerEmail">ইমেইল</label>
          <input
            id="registerEmail"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            autoComplete="email"
            inputMode="email"
            required
          />

          <label htmlFor="registerPassword">পাসওয়ার্ড</label>
          <input
            id="registerPassword"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="registerBloodGroup">রক্তের গ্রুপ</label>
          <select
            id="registerBloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange('bloodGroup')}
            required
          >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>

          <label htmlFor="registerRole">অ্যাকাউন্টের ধরন</label>
          <select id="registerRole" value={formData.role} onChange={handleChange('role')} required>
            <option value="donor">রক্তদাতা</option>
            <option value="finder">রক্ত খুঁজছেন</option>
          </select>

          <label htmlFor="registerDistrict">লোকেশন</label>
          <LocationSelector
            required
            mode="required"
            idPrefix="register"
            onChange={handleLocationChange}
          />

          <label htmlFor="registerPhone">মোবাইল নম্বর</label>
          <input
            id="registerPhone"
            type="text"
            value={formData.phone}
            onChange={handleChange('phone')}
            autoComplete="tel"
            inputMode="tel"
          />

          <label htmlFor="registerLocation">ঠিকানা / লোকেশন</label>
          <input
            id="registerLocation"
            type="text"
            value={formData.location}
            onChange={handleChange('location')}
            autoComplete="street-address"
          />

          {error ? <p id="registerError" className="auth-error full-width">{error}</p> : null}

          <button className="full-width" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'নিবন্ধন'}
          </button>
        </form>

        <p className="auth-switch">
          আগে থেকেই অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link>
        </p>
      </article>
    </section>
  );
};
