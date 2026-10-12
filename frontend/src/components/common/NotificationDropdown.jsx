import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '@api/axios';

const TYPE_COLORS = {
  INFO:    'bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-300',
  WARNING: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300',
  ALERT:   'bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-300',
  ERROR:   'bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-300',
  SUCCESS: 'bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-300',
};

const DOT_COLORS = {
  INFO:    'bg-blue-500',
  WARNING: 'bg-yellow-500',
  ALERT:   'bg-red-500',
  ERROR:   'bg-red-500',
  SUCCESS: 'bg-green-500',
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [marking,       setMarking]       = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 8, isRead: false } });
      setNotifications(res.data?.data ?? []);
    } catch {
      // Silently fall back to empty — non-critical
      setNotifications([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
    finally { setMarking(false); }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800
                    rounded-xl shadow-lg border border-gray-200 dark:border-gray-700
                    z-50 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Notifications
          {unread > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                             bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {unread}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unread > 0 && (
            <button onClick={markAllRead} disabled={marking}
              className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" />
              {marking ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto scrollbar-thin">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="px-4 py-3 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-2 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No unread notifications
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id}
              onClick={() => markOneRead(n.id)}
              className={`px-4 py-3 cursor-pointer transition-colors
                hover:bg-gray-50 dark:hover:bg-gray-700/50
                ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full
                  ${!n.isRead ? (DOT_COLORS[n.type] || 'bg-primary-500') : 'bg-transparent'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {n.type && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0
                    ${TYPE_COLORS[n.type] || TYPE_COLORS.INFO}`}>
                    {n.type}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-center">
        <Link to="/notifications" onClick={onClose}
          className="text-xs text-primary-600 hover:underline font-medium">
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
