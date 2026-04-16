import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="home-hero-surface reveal">
      <article className="home-hero-main">
        <p className="eyebrow">Emergency Ready</p>
        <h2>Find the right donor faster, with location-aware filtering.</h2>
        <p>
          Bangla Blood helps teams quickly discover active donors by blood group, district,
          and upazila so urgent requests can be handled without delays.
        </p>

        <div className="home-hero-actions">
          <Link to="/register" className="inline-link-btn">
            Register as Donor
          </Link>
          <Link to="/donors" className="inline-link-btn ghost-btn">
            Open Full Donor Search
          </Link>
        </div>
      </article>

      <article className="home-hero-side">
        <h3>Why this matters</h3>
        <ul>
          <li>Location cascading reduces mismatch in donor discovery.</li>
          <li>Priority donors and active status improve response speed.</li>
          <li>Mobile-first controls keep operations smooth on the go.</li>
        </ul>
      </article>
    </section>
  );
};
