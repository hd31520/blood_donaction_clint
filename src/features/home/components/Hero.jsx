import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-grid">
      <article className="hero-card primary-card reveal">
        <h2>Donate blood, save lives.</h2>
        <p>
          Bangla Blood is designed for fast donor discovery, secure data flow, and a reliable
          support network for emergency and planned requests.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={() => navigate('/register')}>Become a Donor</button>
          <button type="button" className="ghost-btn" onClick={() => navigate('/donors')}>
            Find Donors
          </button>
        </div>
      </article>
      <article className="hero-card metrics-card reveal delay-1">
        <h3>Platform Snapshot</h3>
        <ul>
          <li>
            <span>API Status</span>
            <strong>Ready</strong>
          </li>
          <li>
            <span>Architecture</span>
            <strong>Scalable MERN</strong>
          </li>
          <li>
            <span>Security</span>
            <strong>Production Middleware</strong>
          </li>
        </ul>
      </article>
    </section>
  );
};
