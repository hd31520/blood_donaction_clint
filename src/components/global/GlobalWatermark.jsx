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
  imageUrl = 'https://i.ibb.co.com/wFxJ4MSV/Chat-GPT-Image-Aug-15-2025-01-06-52-AM.png',
  linkUrl = 'https://hridoy-portfilio.vercel.app/',
  imageSize = 26,
  imageBlur = 0,
}) => {
  const positionClass = positionClassMap[position] || positionClassMap['bottom-right'];

  return (
    <a
      className={`global-watermark ${positionClass}`}
      href={linkUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${brandText || 'Watermark'} portfolio link`}
      title={linkUrl}
      style={{
        opacity,
        color,
      }}
    >
      <span
        className="wm-image-shell"
        style={{
          width: `${imageSize}px`,
          height: `${imageSize}px`,
          filter: `blur(${imageBlur}px)`,
        }}
      >
        <img className="wm-image" src={imageUrl} alt="" aria-hidden="true" />
      </span>

      {brandText || tagline ? (
        <span className="wm-text-block">
          {brandText ? <span className="wm-brand">{brandText}</span> : null}
          {tagline ? <span className="wm-tagline">{tagline}</span> : null}
        </span>
      ) : null}
    </a>
  );
};
