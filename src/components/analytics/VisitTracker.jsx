import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { analyticsService } from '../../services/analyticsService.js';

export const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;

    analyticsService.trackVisit(path).catch(() => {
      // Analytics should never block the app.
    });
  }, [location.pathname, location.search]);

  return null;
};
