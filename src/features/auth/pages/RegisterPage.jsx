import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { LocationSelector } from '../../../components/location/LocationSelector.jsx';
import { useAuth } from '../context/AuthContext.jsx';
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
      missingFields.push('division');
    }
    if (!formData.districtId) {
      missingFields.push('district');
    }
    if (!formData.upazilaId) {
      missingFields.push('upazila');
    }
    if (!formData.areaType) {
      missingFields.push('area type');
    }
    if (!formData.unionId) {
      if (!formData.unionName) {
        missingFields.push(formData.areaType === 'pouroshava' ? 'pouroshava' : 'union');
      }
    }

    if (formData.areaType === 'pouroshava' && !formData.wardNumber) {
      missingFields.push('ward number');
    }

    return missingFields;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!hasCompleteLocation) {
      const missingLocationFields = getMissingLocationFields();
      const errorMessage = `Please select required location fields: ${missingLocationFields.join(', ')}.`;
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register(formData);
      toast.success('Registration successful. Welcome!');
      navigate(getRoleDefaultPath(user?.role), { replace: true });
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      const hasResponse = Boolean(requestError?.response);
      const isTimeout = requestError?.code === 'ECONNABORTED';
      const errorMessage = hasResponse
        ? serverMessage || 'Registration failed due to server validation.'
        : isTimeout
          ? 'Registration is taking too long. Server may be waking up, please try again in a few seconds.'
          : 'Registration failed: network/CORS issue. Please check internet and try again.';

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
        <p className="eyebrow">Create Account</p>
        <h2>Register as Donor</h2>

        <form onSubmit={handleSubmit} className="auth-form grid-two">
          <label htmlFor="registerName">Full Name</label>
          <input
            id="registerName"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />

          <label htmlFor="registerEmail">Email</label>
          <input
            id="registerEmail"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />

          <label htmlFor="registerPassword">Password</label>
          <input
            id="registerPassword"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            required
          />

          <label htmlFor="registerBloodGroup">Blood Group</label>
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

          <label htmlFor="registerRole">Account Type</label>
          <select id="registerRole" value={formData.role} onChange={handleChange('role')} required>
            <option value="donor">Donor</option>
            <option value="finder">Finder</option>
          </select>

          <label htmlFor="registerDistrict">Location</label>
          <LocationSelector
            required
            mode="required"
            idPrefix="register"
            onChange={handleLocationChange}
          />

          <label htmlFor="registerPhone">Phone</label>
          <input
            id="registerPhone"
            type="text"
            value={formData.phone}
            onChange={handleChange('phone')}
          />

          <label htmlFor="registerLocation">Address / Location</label>
          <input
            id="registerLocation"
            type="text"
            value={formData.location}
            onChange={handleChange('location')}
          />

          {error ? <p className="auth-error full-width">{error}</p> : null}

          <button className="full-width" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </article>
    </section>
  );
};
