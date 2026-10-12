import React, { useState, useEffect, useCallback } from 'react';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import { PlusIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { operationRoomAPI } from '@api/operationRoom.api';
import { patientsAPI }      from '@api/patients.api';
import { opdAPI }           from '@api/opd.api';
import { usePagination }    from '@hooks/usePagination';
import toast from 'react-hot-toast';

const OP_TYPES = ['MINOR_SURGERY','MAJOR_SURGERY','CESAREAN_SECTION','APPENDECTOMY','LAPAROTOMY','OTHER'];
const STATUSES = ['SCHEDULED','IN_PROGRESS','COMPLETED','POSTPONED','CANCELLED'];

const EMPTY_FORM = {
  patientId:'', visitId:'', surgeonId:'', operationRoomId:'',
  operationType:'MINOR_SURGERY', scheduledAt:'', estimatedDuration:60,
  preOpDiagnosis:'', notes:'',
};

export default function OperationRoomPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState('');
  const [date,      setDate]      = useState('');
  const [rooms,     setRooms]     = useState([]);
  const [patients,  setPatients]  = useState([]);
  const [visits,    setVisits]    = useState([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showResult,setShowResult]= useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [result,    setResult]    = useState({ postOpNotes:'', complications:'' });
  const [saving,    setSaving]    = useState(false);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operationRoomAPI.getAll({
        page, limit,
        status: status || undefined,
        date:   date   || undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load schedules'); }
    finally  { setLoading(false); }
  }, [page, limit, status, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [status, date]);

  const openAdd = async () => {
    setShowAdd(true);
    try {
      const [rRes, pRes] = await Promise.all([
        operationRoomAPI.getRooms(),
        patientsAPI.getAll({ limit: 300 }),
      ]);
      setRooms(rRes.data?.data ?? []);
      setPatients(pRes.data?.data ?? []);
    } catch { toast.error('Failed to load form data'); }
  };

  const handlePatientChange = async (pid) => {
    setForm(f => ({ ...f, patientId: pid, visitId: '' }));
    setVisits([]);
    if (!pid) return;
    try {
      // Load all visit statuses so user can pick any active visit
      const res = await opdAPI.getAll({ patientId: pid, limit: 50 });
      const active = (res.data?.data ?? []).filter(v =>
        ['OPEN','IN_PROGRESS','PENDING_LAB','PENDING_PHARMACY'].includes(v.status)
      );
      setVisits(active);
    } catch { /* silent */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.operationRoomId || !form.scheduledAt) {
      toast.error('Patient, room and scheduled time are required'); return;
    }
    setSaving(true);
    try {
      await operationRoomAPI.create(form);
      toast.success('Operation scheduled');
      setShowAdd(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to schedule');
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (row, newStatus) => {
    if (newStatus === 'COMPLETED') {
      setSelected(row);
      setResult({ postOpNotes:'', complications:'' });
      setShowResult(true);
      return;
    }
    try {
      await operationRoomAPI.updateStatus(row.id, newStatus);
      toast.success(`Marked as ${newStatus.toLowerCase().replace(/_/g,' ')}`);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await operationRoomAPI.updateStatus(selected.id, 'COMPLETED', result);
      toast.success('Operation completed');
      setShowResult(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    } finally { setSaving(false); }
  };

  const columns = [
    {
      key: 'operationNo', label: 'Op. No',
      render: (v) => <span className="font-mono text-xs font-semibold text-primary-600">{v}</span>,
    },
    {
      key: 'scheduledAt', label: 'Scheduled',
      render: (v) => v ? (
        <div>
          <div className="font-medium">{new Date(v).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
        </div>
      ) : '—',
    },
    {
      key: 'patient', label: 'Patient',
      render: (_, r) => r.patient ? (
        <div>
          <div className="font-medium">{r.patient.firstName} {r.patient.lastName}</div>
          <div className="text-xs text-gray-400">{r.patient.patientId}</div>
        </div>
      ) : '—',
    },
    {
      key: 'surgeon', label: 'Surgeon',
      render: (_, r) => r.surgeon ? `Dr. ${r.surgeon.firstName} ${r.surgeon.lastName}` : '—',
    },
    {
      key: 'room', label: 'Room',
      render: (_, r) => r.room?.name ?? r.operationRoom?.name ?? '—',
    },
    {
      key: 'operationType', label: 'Type',
      render: (v) => <span className="text-xs">{v?.replace(/_/g,' ')}</span>,
    },
    {
      key: 'estimatedDuration', label: 'Est. Duration',
      render: (v) => `${v} min`,
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          {r.status === 'SCHEDULED' && (
            <button onClick={() => handleStatusUpdate(r, 'IN_PROGRESS')}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 inline-flex"
              title="Start">
              <PlayIcon className="w-4 h-4" />
            </button>
          )}
          {r.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusUpdate(r, 'COMPLETED')}
              className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 inline-flex"
              title="Complete">
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operation Room</h1>
          <p className="page-subtitle">Schedule and manage surgical operations</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Schedule Operation
        </button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No operations scheduled"
      />

      {/* Schedule Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Schedule Operation" size="lg"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Patient *</label>
              <select className="input" value={form.patientId}
                onChange={e => handlePatientChange(e.target.value)} required>
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.patientId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Related Visit (Optional)</label>
              <select className="input" value={form.visitId}
                onChange={e => setForm(f => ({ ...f, visitId: e.target.value }))}
                disabled={!form.patientId}>
                <option value="">No visit (direct schedule)</option>
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.visitNo} — {new Date(v.visitDate).toLocaleDateString()} [{v.status}]
                  </option>
                ))}
              </select>
              {form.patientId && visits.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No active visits found — scheduling without a visit.</p>
              )}
            </div>
            <div>
              <label className="label">Operation Room *</label>
              <select className="input" value={form.operationRoomId}
                onChange={e => setForm(f => ({ ...f, operationRoomId: e.target.value }))} required>
                <option value="">Select room...</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Operation Type</label>
              <select className="input" value={form.operationType}
                onChange={e => setForm(f => ({ ...f, operationType: e.target.value }))}>
                {OP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Scheduled Date & Time *</label>
              <input type="datetime-local" className="input" value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Estimated Duration (min)</label>
              <input type="number" className="input" value={form.estimatedDuration}
                onChange={e => setForm(f => ({ ...f, estimatedDuration: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Pre-op Diagnosis</label>
            <textarea className="input" rows={2} value={form.preOpDiagnosis}
              onChange={e => setForm(f => ({ ...f, preOpDiagnosis: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={showResult} onClose={() => setShowResult(false)}
        title="Complete Operation" size="sm"
        footer={
          <>
            <button onClick={() => setShowResult(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleComplete} disabled={saving} className="btn-success">
              {saving ? 'Saving...' : 'Mark Completed'}
            </button>
          </>
        }
      >
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="label">Post-op Notes</label>
            <textarea className="input" rows={3}
              value={result.postOpNotes}
              onChange={e => setResult(r => ({ ...r, postOpNotes: e.target.value }))} />
          </div>
          <div>
            <label className="label">Complications (if any)</label>
            <textarea className="input" rows={2}
              value={result.complications}
              onChange={e => setResult(r => ({ ...r, complications: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
