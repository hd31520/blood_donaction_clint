import { useEffect, useState } from 'react';

export const LiveCounter = ({ value = 0, suffix = '', duration = 700 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    const start = displayValue;
    const diff = target - start;
    const startedAt = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + diff * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return (
    <span className="live-counter">
      {Number(displayValue || 0).toLocaleString('bn-BD')}{suffix}
    </span>
  );
};
