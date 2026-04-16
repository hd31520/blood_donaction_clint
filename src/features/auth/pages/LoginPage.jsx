import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { getRoleDefaultPath } from '../utils/roleRedirect.js';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      toast.success('Login successful.');
      const fallbackPath = getRoleDefaultPath(user?.role);
      const nextPath = location.state?.from?.pathname || fallbackPath;
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      const hasResponse = Boolean(requestError?.response);
      const errorMessage = hasResponse
        ? serverMessage || 'Login failed. Please check your credentials.'
        : 'Login failed: network/CORS issue. Please check internet and try again.';

      console.error('[AUTH_UI][LOGIN_FAILED]', {
        message: requestError?.message,
        status: requestError?.response?.status,
        response: requestError?.response?.data,
        payloadPreview: {
          email,
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
      <article className="auth-card">
        <p className="eyebrow">Welcome Back</p>
        <h2>Login to Bangla Blood</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </article>
    </section>
  );
};
