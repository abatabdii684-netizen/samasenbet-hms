import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@components/common/DataTable';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import api from '@api/axios';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'badge-green', UPDATE: 'badge-blue',
  DELETE: 'badge-red',   VIEW: 'badge-gray', LOGIN: 'badge-yellow',
};

export default function AuditLogsPage() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [module,  setModule]  = useState('');
  const [action,  setAction]  = useState('');
  const [date,    setDate]    = useState('');
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page, limit,
          search: debounced || undefined,
          module: module    || undefined,
          action: action    || undefined,
          date:   date      || undefined,
        },
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load audit logs'); }
    finally  { setLoading(false); }
  }, [page, limit, debounced, module, action, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, module, action, date]);

  const columns = [
    {
      key: 'createdAt', label: 'Date & Time',
      render: (v) => (
        <div>
          <div className="text-sm">{new Date(v).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: 'user', label: 'User',
      render: (_, r) => r.user ? (
        <div>
          <div className="font-medium">{r.user.username}</div>
          {r.user.employee && (
            <div className="text-xs text-gray-400">
              {r.user.employee.firstName} {r.user.employee.lastName}
            </div>
          )}
        </div>
      ) : <span className="text-gray-400">System</span>,
    },
    {
      key: 'action', label: 'Action',
      render: (v) => (
        <span className={`badge ${ACTION_COLORS[v] ?? 'badge-gray'}`}>{v}</span>
      ),
    },
    {
      key: 'module', label: 'Module',
      render: (v) => <span className="text-xs capitalize">{v?.replace(/_/g,' ')}</span>,
    },
    {
      key: 'description', label: 'Description',
      render: (v) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate block">{v || '—'}</span>
      ),
    },
    {
      key: 'ipAddress', label: 'IP Address',
      render: (v) => <span className="font-mono text-xs text-gray-400">{v || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track all system activity and user actions</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="text" className="input" placeholder="Search user or description..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <select className="input" value={module} onChange={e => setModule(e.target.value)}>
            <option value="">All Modules</option>
            {['patients','appointments','billing','pharmacy','laboratory','admissions',
              'employees','users','roles','inventory','reports'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select className="input" value={action} onChange={e => setAction(e.target.value)}>
            <option value="">All Actions</option>
            {['CREATE','UPDATE','DELETE','VIEW','LOGIN'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No audit logs found"
      />
    </div>
  );
}
