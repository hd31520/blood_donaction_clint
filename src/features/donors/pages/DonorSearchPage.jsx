import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { mockDonors } from '../data/mockDonors.js';

export const DonorSearchPage = () => {
  const [bloodGroup, setBloodGroup] = useState('all');

  const filteredDonors = useMemo(() => {
    if (bloodGroup === 'all') {
      return mockDonors;
    }

    return mockDonors.filter((donor) => donor.bloodGroup === bloodGroup);
  }, [bloodGroup]);

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Donor Discovery</p>
        <h2>Advanced Donor Search</h2>
      </header>

      <div className="toolbar">
        <label htmlFor="bloodGroup">Blood Group</label>
        <select
          id="bloodGroup"
          value={bloodGroup}
          onChange={(event) => setBloodGroup(event.target.value)}
        >
          <option value="all">All</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Blood Group</th>
              <th>District</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDonors.map((donor) => (
              <tr key={donor.id}>
                <td>{donor.name}</td>
                <td>{donor.bloodGroup}</td>
                <td>{donor.district}</td>
                <td>
                  <span className={`status-chip ${donor.availability}`}>{donor.availability}</span>
                </td>
                <td>
                  <Link to={`/donors/${donor.id}`} className="inline-link-btn small">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
