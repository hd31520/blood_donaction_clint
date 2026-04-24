const buildPoints = (data, width, height, padding) => {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const step = data.length > 1 ? usableWidth / (data.length - 1) : 0;

  return data.map((item, index) => {
    const value = Number(item.value || 0);
    const x = padding + index * step;
    const y = height - padding - (value / maxValue) * usableHeight;

    return {
      ...item,
      value,
      x,
      y,
    };
  });
};

const buildSmoothPath = (points) => {
  if (!points.length) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;

    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

export const SmoothLineChart = ({ data = [], label = 'Line chart' }) => {
  const width = 640;
  const height = 240;
  const padding = 28;
  const safeData = data.length ? data : [{ label: 'No data', value: 0 }];
  const points = buildPoints(safeData, width, height, padding);
  const path = buildSmoothPath(points);
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const maxValue = Math.max(...safeData.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="smooth-chart" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="smooth-chart-svg">
        <defs>
          <linearGradient id="smoothChartArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + ratio * (height - padding * 2)}
            y2={padding + ratio * (height - padding * 2)}
            className="smooth-chart-grid"
          />
        ))}

        <path d={areaPath} className="smooth-chart-area" />
        <path d={path} className="smooth-chart-line" />

        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle className="smooth-chart-dot" cx={point.x} cy={point.y} r="4" />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}
      </svg>

      <div className="smooth-chart-meta">
        <span>0</span>
        <strong>{Number(maxValue).toLocaleString('bn-BD')}</strong>
      </div>

      <div className="smooth-chart-labels">
        {safeData.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
};
