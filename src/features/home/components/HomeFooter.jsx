import { Link } from 'react-router-dom';

export const HomeFooter = () => {
  return (
    <footer className="home-footer reveal">
      <article>
        <h4>About Bangla Blood</h4>
        <p>
          A digital blood donor coordination platform focused on fast matching, reliable contact,
          and location-aware donor discovery.
        </p>
      </article>

      <article>
        <h4>Contact</h4>
        <p>Email: support@banglablood.org</p>
        <p>Phone: +880 1700-000000</p>
        <p>Address: Dhaka, Bangladesh</p>
      </article>

      <article>
        <h4>Quick Links</h4>
        <p>
          <Link to="/home">Home</Link>
        </p>
        <p>
          <Link to="/donors">Donor Search</Link>
        </p>
        <p>
          <Link to="/community">Community</Link>
        </p>
      </article>
    </footer>
  );
};
