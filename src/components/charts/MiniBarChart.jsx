export const MiniBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mini-chart" role="img" aria-label="Monthly donation activity chart">
      {data.map((item) => (
        <div key={item.label} className="mini-chart-col">
          <div className="mini-chart-bar-wrap">
            <div
              className="mini-chart-bar"
              style={{ height: `${Math.max((item.value / maxValue) * 100, 5)}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};
