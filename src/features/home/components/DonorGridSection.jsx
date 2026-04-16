import { DonorCard } from './DonorCard.jsx';

const SkeletonCard = () => (
  <article className="home-donor-card skeleton">
    <div className="home-skeleton-line w-55" />
    <div className="home-skeleton-line w-35" />
    <div className="home-skeleton-line w-70" />
    <div className="home-skeleton-line w-45" />
  </article>
);

export const DonorGridSection = ({
  title,
  donors,
  isLoading,
  emptyMessage,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <section className="home-donor-grid-wrap reveal">
      <header className="home-donor-grid-head">
        <h3>{title}</h3>
        <p>Live donor data fetched from backend API.</p>
      </header>

      {isLoading ? (
        <div className="home-donor-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={`donor-skeleton-${index + 1}`} />
          ))}
        </div>
      ) : donors.length ? (
        <div className="home-donor-grid">
          {donors.map((donorProfile) => (
            <DonorCard key={donorProfile.id} donorProfile={donorProfile} />
          ))}
        </div>
      ) : (
        <article className="home-empty-state">
          <h4>No donors found</h4>
          <p>{emptyMessage}</p>
        </article>
      )}

      {totalPages > 1 ? (
        <div className="home-pagination">
          <button
            type="button"
            className="retry-inline-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="retry-inline-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
};
