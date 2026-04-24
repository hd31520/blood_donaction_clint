import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { getAuthErrorMessage } from '../utils/authErrorMessage.js';
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
      toast.success('লগইন সফল হয়েছে।');
      const fallbackPath = getRoleDefaultPath(user?.role);
      const nextPath = location.state?.from?.pathname || fallbackPath;
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      const serverMessage = requestError?.response?.data?.message;
      const status = requestError?.response?.status;
      const hasResponse = Boolean(requestError?.response);
      const isTimeout = requestError?.code === 'ECONNABORTED';
      const errorMessage = getAuthErrorMessage({
        mode: 'login',
        status,
        serverMessage,
        hasResponse,
        isTimeout,
      });

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
      <article className="auth-card auth-card-login">
        <div className="auth-brand-row">
          <span className="auth-brand-mark">BB</span>
          <div>
            <p className="eyebrow">স্বাগতম</p>
            <h2>বাংলা ব্লাডে লগইন করুন</h2>
          </div>
        </div>
        <p className="auth-subtitle">রক্তদাতা, রোগী ও দায়িত্বশীল টিমের জন্য নিরাপদ অ্যাক্সেস।</p>

        <form onSubmit={handleSubmit} className="auth-form" aria-describedby={error ? 'loginError' : undefined}>
          <label htmlFor="loginEmail">ইমেইল</label>
          <input
            id="loginEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'loginError' : undefined}
            required
          />

          <label htmlFor="loginPassword">পাসওয়ার্ড</label>
          <input
            id="loginPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'loginError' : undefined}
            required
          />

          {error ? <p id="loginError" className="auth-error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'লগইন হচ্ছে...' : 'লগইন'}
          </button>
        </form>

        <p className="auth-switch">
          অ্যাকাউন্ট নেই? <Link to="/register">নিবন্ধন করুন</Link>
        </p>
      </article>
    </section>
  );
};
