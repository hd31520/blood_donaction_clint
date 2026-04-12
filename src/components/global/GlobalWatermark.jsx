const positionClassMap = {
  'top-left': 'wm-top-left',
  'top-right': 'wm-top-right',
  'bottom-left': 'wm-bottom-left',
  'bottom-right': 'wm-bottom-right',
  center: 'wm-center',
};

export const GlobalWatermark = ({
  brandText,
  tagline,
  position = 'bottom-right',
  opacity = 0.08,
  color = '#7a8b84',
}) => {
  const positionClass = positionClassMap[position] || positionClassMap['bottom-right'];

  return (
    <div
      className={`global-watermark ${positionClass}`}
      style={{
        opacity,
        color,
      }}
      aria-hidden="true"
    >
      <div className="wm-mark">+</div>
      <div className="wm-text-block">
        <p className="wm-brand">{brandText}</p>
        <p className="wm-tagline">{tagline}</p>
      </div>
    </div>
  );
};
