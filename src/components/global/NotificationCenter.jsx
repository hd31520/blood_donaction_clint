import { Bell, CheckCheck, CircleDot } from 'lucide-react';
import { useState } from 'react';

import { useNotifications } from '../../features/notifications/context/NotificationContext.jsx';

const typeLabelMap = {
  donation_request: 'Donation Request',
  donation_approval: 'Donation Approval',
  admin_update: 'Admin Update',
};

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    seedDemo,
  } = useNotifications();

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <Bell size={18} />
        {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="notification-panel">
          <header className="notification-header">
            <h4>Notifications</h4>
            <div className="notification-actions">
              <button type="button" onClick={refreshNotifications}>
                Refresh
              </button>
              <button type="button" onClick={markAllAsRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
          </header>

          <div className="notification-body">
            {isLoading ? <p className="notification-empty">Loading notifications...</p> : null}

            {!isLoading && notifications.length === 0 ? (
              <div className="notification-empty-wrap">
                <p className="notification-empty">No notifications yet.</p>
                <button type="button" onClick={seedDemo}>
                  Create Demo Notifications
                </button>
              </div>
            ) : null}

            {!isLoading && notifications.length > 0
              ? notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-item-head">
                      <p>{notification.title}</p>
                      {!notification.isRead ? <CircleDot size={12} /> : null}
                    </div>
                    <span className="notification-type">{typeLabelMap[notification.type]}</span>
                    <p className="notification-message">{notification.message}</p>
                    <div className="notification-item-actions">
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      {!notification.isRead ? (
                        <button type="button" onClick={() => markAsRead(notification.id)}>
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
