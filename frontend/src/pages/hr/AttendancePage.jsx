import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '@components/common/DataTable';
import { StatusBadge } from '@components/common/Badge';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { attendanceAPI } from '@api/attendance.api';
import { employeesAPI }  from '@api/employees.api';
import { usePagination }  from '@hooks/usePagination';
import { useDebounce }    from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  PRESENT:  { cls: 'badge-green',  label: 'Present'  },
  ABSENT:   { cls: 'badge-red',    label: 'Absent'   },
  LATE:     { cls: 'badge-yellow', label: 'Late'     },
  HALF_DAY: { cls: 'badge-yellow', label: 'Half Day' },
  ON_LEAVE: { cls: 'badge-blue',   label: 'On Leave' },
};

export default function AttendancePage() {
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [today,    setToday]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [tab,      setTab]      = useState('today');
  const [checkInEmp, setCheckInEmp] = useState('');
  const [employees,  setEmployees]  = useState([]);
  const [saving,   setSaving]   = useState(false);
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchToday = useCallback(async () => {
    try {
      const res = await attendanceAPI.getToday();
      setToday(res.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAll({
        page, limit,
        search: debounced || undefined,
        date:   date      || undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load attendance'); }
    finally  { setLoading(false); }
  }, [page, limit, debounced, date]);

  useEffect(() => { fetchToday(); }, [fetchToday]);
  useEffect(() => { fetchAll();   }, [fetchAll]);
  useEffect(() => { resetPage();  }, [debounced, date]);

  useEffect(() => {
    employeesAPI.getAll({ limit: 300, status: 'ACTIVE' })
      .then(r => setEmployees(r.data?.data ?? []))
      .catch(() => { /* silent */ });
  }, []);

  const handleCheckIn = async () => {
    if (!checkInEmp) { toast.error('Select employee'); return; }
    setSaving(true);
    try {
      await attendanceAPI.checkIn({ employeeId: parseInt(checkInEmp) });
      toast.success('Checked in');
      setCheckInEmp('');
      fetchToday();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  };

  const handleCheckOut = async (empId) => {
    try {
      await attendanceAPI.checkOut({ employeeId: empId });
      toast.success('Checked out');
      fetchToday();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    }
  };

  // today stats
  const todayStats = today.reduce(
    (a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {}
  );

  const todayCols = [
    {
      key: 'employee', label: 'Employee',
      render: (_, r) => r.employee ? (
        <div>
          <div className="font-medium">{r.employee.firstName} {r.employee.lastName}</div>
          <div className="text-xs text-gray-400">{r.employee.jobTitle}</div>
        </div>
      ) : '—',
    },
    {
      key: 'checkIn', label: 'Check In',
      render: (v) => v ? new Date(v).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—',
    },
    {
      key: 'checkOut', label: 'Check Out',
      render: (v) => v ? new Date(v).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : (
        <span className="text-yellow-500 text-xs">Not out yet</span>
      ),
    },
    {
      key: 'workHours', label: 'Hours',
      render: (v) => v ? `${v}h` : '—',
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => !r.checkOut && r.checkIn ? (
        <button onClick={() => handleCheckOut(r.employeeId)}
          className="text-xs text-primary-600 hover:underline">
          Check Out
        </button>
      ) : null,
    },
  ];

  const histCols = [
    {
      key: 'date', label: 'Date',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'employee', label: 'Employee',
      render: (_, r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—',
    },
    {
      key: 'checkIn', label: 'In',
      render: (v) => v ? new Date(v).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—',
    },
    {
      key: 'checkOut', label: 'Out',
      render: (v) => v ? new Date(v).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—',
    },
    { key: 'workHours', label: 'Hrs', render: (v) => v ? `${v}h` : '—' },
    { key: 'overtime',  label: 'OT',  render: (v) => parseFloat(v) > 0 ? `${v}h` : '—' },
    { key: 'status',    label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track employee attendance and work hours</p>
        </div>
        <button onClick={() => { fetchToday(); fetchAll(); }} className="btn-secondary">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Quick check-in */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Check-In</p>
        <div className="flex gap-3">
          <select className="input flex-1" value={checkInEmp}
            onChange={e => setCheckInEmp(e.target.value)}>
            <option value="">Select employee...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} — {e.employeeNo}
              </option>
            ))}
          </select>
          <button onClick={handleCheckIn} disabled={saving} className="btn-primary whitespace-nowrap">
            {saving ? 'Processing...' : 'Check In'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CFG).map(([s, cfg]) => (
          <div key={s} className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayStats[s] ?? 0}</p>
            <span className={`badge ${cfg.cls} mt-1`}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {[{ key:'today', label: "Today's Attendance" }, { key:'history', label: 'History' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'today' && (
        <div className="card overflow-hidden">
          {today.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No attendance recorded today</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr>{todayCols.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {today.map(r => (
                    <tr key={r.id}>
                      {todayCols.map(c => (
                        <td key={c.key}>{c.render ? c.render(r[c.key], r) : r[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <>
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" className="input" placeholder="Search employee..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <input type="date" className="input" value={date}
                onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <DataTable
            columns={histCols} data={data} loading={loading}
            pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
            onPageChange={goToPage} emptyText="No records found"
          />
        </>
      )}
    </div>
  );
}
