import React, { useState, useEffect, useCallback } from 'react';
import {
  BellIcon, CheckIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InformationCircleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { usePagination } from '@hooks/usePagination';
import api from '@api/axios';
import toast from 'react-hot-toast';

const TYPE_CFG = {
  INFO:    { icon: InformationCircleIcon, cls: 'text-blue-600   bg-blue-50   dark:bg-blue-900/20'   },
  WARNING: { icon: ExclamationTriangleIcon,cls:'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  ALERT:   { icon: ExclamationTriangleIcon,cls:'text-red-600    bg-red-50    dark:bg-red-900/20'    },
  ERROR:   { icon: ExclamationTriangleIcon,cls:'text-red-600    bg-red-50    dark:bg-red-900/20'    },
  SUCCESS: { icon: CheckCircleIcon,        cls:'text-green-600  bg-green-50  dark:bg-green-900/20'  },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsPage() {
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState('all'); // all | unread | read
  const [type,     setType]     = useState('');
  const { page, limit, goToPage, resetPage } = usePagination(1, 20);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit,
        ...(filter === 'unread' ? { isRead: false } : {}),
        ...(filter === 'read'   ? { isRead: true  } : {}),
        ...(type ? { type } : {}),
      };
      const res = await api.get('/notifications', { params });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? res.data?.total ?? 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally { setLoading(false); }
  }, [page, limit, filter, type]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [filter, type]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setData(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      toast.success('All notifications marked as read');
      fetchData();
    } catch { toast.error('Failed to mark all as read'); }
  };

  const unreadCount = data.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {total} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading} className="btn-secondary">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary">
              <CheckIcon className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Read status */}
          <div className="flex gap-1">
            {[
              { key: 'all',    label: 'All'    },
              { key: 'unread', label: 'Unread' },
              { key: 'read',   label: 'Read'   },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select className="input w-auto text-xs py-1.5 ml-2" value={type}
            onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            {['INFO','WARNING','ALERT','ERROR','SUCCESS'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          [1,2,3,4,5].map(i => (
            <div key={i} className="card p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="card p-16 text-center text-gray-400">
            <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications found</p>
          </div>
        ) : data.map(n => {
          const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.INFO;
          const Icon = cfg.icon;
          return (
            <div key={n.id}
              className={`card p-4 flex items-start gap-3 transition-all cursor-pointer
                hover:shadow-md
                ${!n.isRead ? 'border-l-4 border-l-primary-500' : 'opacity-80'}`}
              onClick={() => !n.isRead && markRead(n.id)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium truncate ${
                    !n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {n.message}
                </p>
                {n.module && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full
                    bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">
                    {n.module}
                  </span>
                )}
              </div>
              {!n.isRead && (
                <button
                  onClick={e => { e.stopPropagation(); markRead(n.id); }}
                  className="text-xs text-primary-600 hover:underline flex-shrink-0 mt-0.5"
                  title="Mark as read"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs">
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 py-2">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button onClick={() => goToPage(page + 1)} disabled={page >= Math.ceil(total / limit)} className="btn-secondary py-1.5 px-3 text-xs">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
