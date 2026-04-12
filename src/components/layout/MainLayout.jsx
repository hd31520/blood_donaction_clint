export const MainLayout = ({ children }) => {
  return (
    <div className="page-shell">
      <header className="top-bar">
        <h1>Bangla Blood</h1>
        <p>Connecting blood donors and recipients across Bangladesh</p>
      </header>
      <main>{children}</main>
    </div>
  );
};
