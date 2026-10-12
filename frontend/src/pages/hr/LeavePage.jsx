import React, { useState, useEffect, useCallback } from 'react';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { leaveAPI }     from '@api/leave.api';
import { employeesAPI } from '@api/employees.api';
import { usePagination } from '@hooks/usePagination';
import toast from 'react-hot-toast';

const EMPTY = { employeeId:'', leaveTypeId:'', startDate:'', endDate:'', reason:'' };

export default function LeavePage() {
  const [data,       setData]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [status,     setStatus]     = useState('PENDING');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveAPI.getAll({ page, limit, status: status || undefined });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load leave requests'); }
    finally  { setLoading(false); }
  }, [page, limit, status]);

  const fetchMeta = useCallback(async () => {
    try {
      const [ltRes, empRes] = await Promise.all([
        leaveAPI.getTypes(),
        employeesAPI.getAll({ limit: 300, status: 'ACTIVE' }),
      ]);
      setLeaveTypes(ltRes.data?.data  ?? []);
      setEmployees(empRes.data?.data  ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); },  [fetchData]);
  useEffect(() => { fetchMeta(); },  [fetchMeta]);
  useEffect(() => { resetPage(); },  [status]);

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approve(id);
      toast.success('Leave approved');
      fetchData();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const handleReject = async (id) => {
    const note = window.prompt('Rejection reason:');
    if (note === null) return;
    try {
      await leaveAPI.reject(id, note);
      toast.success('Leave rejected');
      fetchData();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.leaveTypeId || !form.startDate || !form.endDate) {
      toast.error('All required fields must be filled'); return;
    }
    setSaving(true);
    try {
      await leaveAPI.create(form);
      toast.success('Leave request submitted');
      setShowAdd(false);
      setForm(EMPTY);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit');
    } finally { setSaving(false); }
  };

  // duration preview
  const duration = form.startDate && form.endDate
    ? Math.ceil(Math.abs(new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24)) + 1
    : 0;

  const columns = [
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
      key: 'leaveType', label: 'Leave Type',
      render: (_, r) => <span className="badge badge-blue">{r.leaveType?.name}</span>,
    },
    {
      key: 'startDate', label: 'From',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'endDate', label: 'To',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    { key: 'totalDays', label: 'Days' },
    {
      key: 'reason', label: 'Reason',
      render: (v) => <span className="text-sm text-gray-500 truncate max-w-xs block">{v || '—'}</span>,
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => r.status === 'PENDING' ? (
        <div className="flex items-center gap-1">
          <button onClick={() => handleApprove(r.id)}
            className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 inline-flex" title="Approve">
            <CheckCircleIcon className="w-4 h-4" />
          </button>
          <button onClick={() => handleReject(r.id)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 inline-flex" title="Reject">
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Review and manage employee leave requests</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Status tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {['PENDING','APPROVED','REJECTED','CANCELLED',''].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                status === s
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </nav>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No leave requests found"
      />

      {/* New Request Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Submit Leave Request" size="md"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select className="input" value={form.employeeId}
              onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} required>
              <option value="">Select employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} — {e.employeeNo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Leave Type *</label>
            <select className="input" value={form.leaveTypeId}
              onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} required>
              <option value="">Select type...</option>
              {leaveTypes.map(lt => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.daysAllowed} days, {lt.isPaid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className="input" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>
          {duration > 0 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
              Duration: <strong>{duration} day{duration !== 1 ? 's' : ''}</strong>
            </div>
          )}
          <div>
            <label className="label">Reason</label>
            <textarea className="input" rows={3} placeholder="Reason for leave..."
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
