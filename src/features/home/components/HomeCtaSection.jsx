import { Link } from 'react-router-dom';

export const HomeCtaSection = () => {
  return (
    <section className="home-cta-section reveal">
      <div>
        <p className="eyebrow">Become a Lifesaver</p>
        <h3>Join the donor network today.</h3>
        <p>
          Register your blood profile and location to help hospitals and families find support in
          critical moments.
        </p>
      </div>

      <Link to="/register" className="inline-link-btn">
        Register as Donor
      </Link>
    </section>
  );
};
