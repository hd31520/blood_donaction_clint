import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    districtId: '',
    upazilaId: '',
    unionId: '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await register(formData);
      navigate(getRoleDefaultPath(user?.role), { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Registration failed. Please try again.');
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

          <label htmlFor="registerDistrict">District ID</label>
          <input
            id="registerDistrict"
            type="text"
            value={formData.districtId}
            onChange={handleChange('districtId')}
            required
          />

          <label htmlFor="registerUpazila">Upazila ID</label>
          <input
            id="registerUpazila"
            type="text"
            value={formData.upazilaId}
            onChange={handleChange('upazilaId')}
            required
          />

          <label htmlFor="registerUnion">Union ID</label>
          <input
            id="registerUnion"
            type="text"
            value={formData.unionId}
            onChange={handleChange('unionId')}
            required
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
