export const CommunityPage = () => {
  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Network</p>
        <h2>Community Coordination</h2>
      </header>

      <div className="panel-grid">
        <article className="panel-card">
          <h3>Upcoming Drives</h3>
          <ul className="list-clean">
            <li>Dhaka Medical Campus - 21 April</li>
            <li>Rajshahi Central Hall - 25 April</li>
            <li>Khulna Community Center - 30 April</li>
          </ul>
        </article>

        <article className="panel-card">
          <h3>Volunteer Focus</h3>
          <ul className="list-clean">
            <li>Reactivate inactive O- donors</li>
            <li>Verify union-level donor profiles</li>
            <li>Coordinate emergency response channels</li>
          </ul>
        </article>
      </div>
    </section>
  );
};
