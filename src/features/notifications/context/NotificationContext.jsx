import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { notificationService } from '../services/notificationService.js';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const refreshNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setMeta({ total: 0, page: 1, limit: 20, totalPages: 0 });
      return;
    }

    setIsLoading(true);

    try {
      const response = await notificationService.getMyNotifications({ page: 1, limit: 20 });
      setNotifications(response.data || []);
      setMeta(response.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    await refreshNotifications();
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    await refreshNotifications();
  };

  const seedDemo = async () => {
    await notificationService.seedDemoNotifications();
    await refreshNotifications();
  };

  useEffect(() => {
    refreshNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = setInterval(refreshNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const value = useMemo(
    () => ({
      notifications,
      meta,
      isLoading,
      unreadCount,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      seedDemo,
    }),
    [isLoading, meta, notifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
};
