import React, { useState, useEffect, useRef } from 'react';
import {
  FiBell, FiX, FiCalendar, FiAlertCircle,
  FiCheckCircle, FiClock, FiDollarSign, FiUser
} from 'react-icons/fi';

const notifIcons = {
  appointment: { icon: FiCalendar, bg: 'bg-blue-100', color: 'text-blue-600' },
  alert: { icon: FiAlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  success: { icon: FiCheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  reminder: { icon: FiClock, bg: 'bg-orange-100', color: 'text-orange-600' },
  billing: { icon: FiDollarSign, bg: 'bg-purple-100', color: 'text-purple-600' },
  patient: { icon: FiUser, bg: 'bg-indigo-100', color: 'text-indigo-600' }
};

// Demo notifications - in production these come from API
const demoNotifications = [
  { id: 1, type: 'appointment', title: 'Upcoming Appointment', message: 'Patient Ravi Kumar at 11:30 AM', time: '5 min ago', unread: true },
  { id: 2, type: 'billing', title: 'Payment Received', message: '₹2,500 from Priya Sharma', time: '15 min ago', unread: true },
  { id: 3, type: 'alert', title: 'Lab Results Ready', message: 'Blood test results for Amit Patel are available', time: '1 hr ago', unread: true },
  { id: 4, type: 'reminder', title: 'Follow-up Reminder', message: 'Patient Sunita needs 7-day follow-up', time: '2 hrs ago', unread: false },
  { id: 5, type: 'success', title: 'Prescription Sent', message: 'WhatsApp prescription sent to Mohan', time: '3 hrs ago', unread: false },
  { id: 6, type: 'patient', title: 'New Patient Registered', message: 'Karthik S. has registered online', time: '4 hrs ago', unread: false }
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(demoNotifications);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const dismissNotif = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="text-xl text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 w-96 max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <FiX className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto max-h-[420px] divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <FiBell className="mx-auto text-3xl mb-2 opacity-50" />
                No notifications
              </div>
            ) : (
              notifications.map((notif) => {
                const config = notifIcons[notif.type] || notifIcons.alert;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group ${notif.unread ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`${config.color} text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                        {notif.unread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{notif.time}</p>
                    </div>
                    <button
                      onClick={() => dismissNotif(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                    >
                      <FiX className="text-gray-400 text-sm" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
