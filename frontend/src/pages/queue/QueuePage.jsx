import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  UserGroupIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon,
  PlusIcon, ArrowPathIcon, BoltIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { queueAPI }    from '@api/queue.api';
import { patientsAPI } from '@api/patients.api';
import toast from 'react-hot-toast';

// ── constants ──────────────────────────────────────────────────────
const CLINIC_TYPES = [
  { value: 'GENERAL_OPD',       label: 'General OPD'       },
  { value: 'INTERNAL_MEDICINE', label: 'Internal Medicine' },
  { value: 'SURGERY',           label: 'Surgery'           },
  { value: 'GYNECOLOGY',        label: 'Gynecology'        },
  { value: 'PEDIATRICS',        label: 'Pediatrics'        },
  { value: 'PHYSIOTHERAPY',     label: 'Physiotherapy'     },
  { value: 'EYE_CLINIC',        label: 'Eye Clinic'        },
];

const PRIORITY_CONFIG = {
  IMMEDIATE:   { label: 'Immediate',   cls: 'bg-red-100    text-red-700    border border-red-300',    Icon: BoltIcon               },
  URGENT:      { label: 'Urgent',      cls: 'bg-orange-100 text-orange-700 border border-orange-300', Icon: ExclamationTriangleIcon },
  LESS_URGENT: { label: 'Less Urgent', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-300', Icon: ClockIcon              },
  NON_URGENT:  { label: 'Non-Urgent',  cls: 'bg-green-100  text-green-700  border border-green-300',  Icon: CheckCircleIcon        },
};

// ── small components ────────────────────────────────────────────────
function StatCard({ Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
      </div>
    </div>
  );
}

function QueueCard({ entry, onComplete, onSkip }) {
  const p   = entry.patient;
  const cfg = PRIORITY_CONFIG[entry.priority] ?? PRIORITY_CONFIG.NON_URGENT;
  const active = entry.status === 'IN_PROGRESS';

  return (
    <div className={`card p-4 border-l-4 transition-all ${
      active
        ? 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
        : 'border-l-gray-200 dark:border-l-gray-700'
    }`}>
      <div className="flex items-start gap-3">
        {/* Token bubble */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
          text-lg font-bold ${active
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}>
          {entry.tokenNumber}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate">
            {p?.firstName} {p?.lastName}
          </p>
          <p className="text-xs text-gray-400">{p?.patientId} · {p?.phone}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
              <cfg.Icon className="w-3 h-3" /> {cfg.label}
            </span>
            <StatusBadge status={entry.status} />
          </div>
          {entry.calledAt && (
            <p className="text-xs text-gray-400 mt-1">
              Called at {new Date(entry.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Action buttons — only for IN_PROGRESS */}
        {active && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => onComplete(entry.id)} className="btn-success py-1 px-2 text-xs">
              <CheckCircleIcon className="w-3.5 h-3.5" /> Done
            </button>
            <button onClick={() => onSkip(entry.id)} className="btn-secondary py-1 px-2 text-xs">
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main page ───────────────────────────────────────────────────────
export default function QueuePage() {
  const [queue,      setQueue]      = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(false);
  const [calling,    setCalling]    = useState(false);
  const [clinicType, setClinicType] = useState('GENERAL_OPD');
  const [showModal,  setShowModal]  = useState(false);
  const [patients,   setPatients]   = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({ patientId: '', priority: 'NON_URGENT' });
  const timerRef = useRef(null);

  // ── fetch ───────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        queueAPI.getActive(),
        queueAPI.getStats(clinicType),
      ]);
      const all = qRes.data?.data ?? [];
      setQueue(all.filter(e => e.clinicType === clinicType));
      setStats(sRes.data?.data ?? {});
    } catch {
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [clinicType]);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 30_000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  // ── call next ────────────────────────────────────────────────────
  const handleCallNext = async () => {
    setCalling(true);
    try {
      const res  = await queueAPI.callNext(clinicType);
      const next = res.data?.data;
      if (next) {
        toast.success(`Token #${next.tokenNumber} — ${next.patient?.firstName} ${next.patient?.lastName}`);
      } else {
        toast('No patients waiting', { icon: 'ℹ️' });
      }
      fetchAll();
    } catch {
      toast.error('Failed to call next patient');
    } finally {
      setCalling(false);
    }
  };

  // ── complete / skip ──────────────────────────────────────────────
  const handleComplete = async (id) => {
    try {
      await queueAPI.updateStatus(id, 'COMPLETED');
      toast.success('Marked as completed');
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  const handleSkip = async (id) => {
    try {
      await queueAPI.updateStatus(id, 'SKIPPED');
      toast('Patient skipped', { icon: '⏭️' });
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  // ── add to queue ────────────────────────────────────────────────
  const openModal = async () => {
    setShowModal(true);
    try {
      const res = await patientsAPI.getAll({ limit: 300 });
      setPatients(res.data?.data ?? []);
    } catch { toast.error('Failed to load patients'); }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ patientId: '', priority: 'NON_URGENT' });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error('Please select a patient'); return; }
    setSaving(true);
    try {
      const res = await queueAPI.create({ ...form, clinicType });
      toast.success(`Token #${res.data?.data?.tokenNumber} assigned`);
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add to queue');
    } finally { setSaving(false); }
  };

  // ── derived ──────────────────────────────────────────────────────
  const waiting    = queue.filter(e => e.status === 'WAITING');
  const inProgress = queue.filter(e => e.status === 'IN_PROGRESS');
  const clinicLabel = CLINIC_TYPES.find(c => c.value === clinicType)?.label ?? clinicType;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Queue Management</h1>
          <p className="page-subtitle">Real-time patient queue — {clinicLabel}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} disabled={loading} className="btn-secondary" title="Refresh">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openModal} className="btn-secondary">
            <PlusIcon className="w-4 h-4" /> Add Patient
          </button>
          <button onClick={handleCallNext} disabled={calling} className="btn-primary">
            <ArrowRightIcon className="w-4 h-4" />
            {calling ? 'Calling...' : 'Call Next'}
          </button>
        </div>
      </div>

      {/* ── Clinic tabs ── */}
      <div className="card p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CLINIC_TYPES.map((c) => (
            <button
              key={c.value}
              onClick={() => setClinicType(c.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                clinicType === c.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard Icon={ClockIcon}       label="Waiting"     value={stats.waiting}    color="text-yellow-600 bg-yellow-50" />
        <StatCard Icon={ArrowRightIcon}  label="In Progress" value={stats.inProgress} color="text-blue-600   bg-blue-50"   />
        <StatCard Icon={CheckCircleIcon} label="Completed"   value={stats.completed}  color="text-green-600  bg-green-50"  />
        <StatCard Icon={UserGroupIcon}   label="Total Today" value={stats.total}      color="text-purple-600 bg-purple-50" />
      </div>

      {/* ── Queue board ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Currently serving */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Currently Serving ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">
                No patient is being served right now.<br />
                Press <strong>Call Next</strong> to start.
              </div>
            ) : inProgress.map(e => (
              <QueueCard key={e.id} entry={e} onComplete={handleComplete} onSkip={handleSkip} />
            ))}
          </div>
        </div>

        {/* Waiting list */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Waiting ({waiting.length})
          </h2>
          <div className="space-y-3 max-h-[580px] overflow-y-auto scrollbar-thin pr-1">
            {loading ? (
              <div className="card p-8 text-center text-gray-400 text-sm">Loading queue...</div>
            ) : waiting.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">
                Queue is empty for {clinicLabel}
              </div>
            ) : waiting.map(e => (
              <QueueCard key={e.id} entry={e} onComplete={handleComplete} onSkip={handleSkip} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Add to Queue Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={`Add Patient to Queue — ${clinicLabel}`}
        size="sm"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary">
              {saving ? 'Adding...' : 'Add to Queue'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Patient *</label>
            <select
              className="input"
              value={form.patientId}
              onChange={(e) => setForm(f => ({ ...f, patientId: e.target.value }))}
              required
            >
              <option value="">Select patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.patientId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            Clinic: <strong>{clinicLabel}</strong><br />
            A token number is assigned automatically.
          </div>
        </form>
      </Modal>
    </div>
  );
}
