import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link }        from 'react-router-dom';
import Modal from '@components/common/Modal';
import DataTable from '@components/common/DataTable';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, HeartIcon, BeakerIcon,
  BoltIcon, ExclamationTriangleIcon, ClockIcon, CheckCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { triageAPI }   from '@api/triage.api';
import { billingAPI }  from '@api/billing.api';
import { patientsAPI } from '@api/patients.api';
import { opdAPI }      from '@api/opd.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

// ── constants ──────────────────────────────────────────────────────
const PRIORITIES = [
  { value: 'IMMEDIATE',   label: 'Immediate',   icon: BoltIcon,               cls: 'bg-red-100    text-red-700    border-red-300'    },
  { value: 'URGENT',      label: 'Urgent',      icon: ExclamationTriangleIcon, cls: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'LESS_URGENT', label: 'Less Urgent', icon: ClockIcon,               cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'NON_URGENT',  label: 'Non-Urgent',  icon: CheckCircleIcon,         cls: 'bg-green-100  text-green-700  border-green-300'  },
];

const EMPTY_FORM = {
  patientId: '', visitId: '',
  temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '',
  pulseRate: '', respiratoryRate: '', oxygenSaturation: '',
  weight: '', height: '',
  diagnosis: '', priority: 'NON_URGENT', notes: '',
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITIES.find(p => p.value === priority) ?? PRIORITIES[3];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function VitalField({ label, value, unit, warning }) {
  return (
    <div className={`rounded-lg p-3 border ${warning ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${warning ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
        {value ?? '—'} {value && unit ? <span className="text-xs font-normal text-gray-400">{unit}</span> : null}
      </p>
    </div>
  );
}

// ── BillLink — fetches bill for a visit and shows link ─────────
function BillLink({ visitId }) {
  const [billId, setBillId] = React.useState(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    billingAPI.getAll({ visitId }).then(res => {
      if (cancelled) return;
      const bill = res.data?.data?.find(b => b.visitId === visitId);
      if (bill) setBillId(bill.id);
      setChecked(true);
    }).catch(() => setChecked(true));
    return () => { cancelled = true; };
  }, [visitId]);

  if (!checked) return null;
  if (!billId)  return null;

  return (
    <Link to={`/billing/${billId}`}
      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium"
      title="View Bill">
      <CreditCardIcon className="w-3.5 h-3.5" /> Bill
    </Link>
  );
}

// ── main page ───────────────────────────────────────────────────────
export default function TriagePage() {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [priority, setPriority] = useState('');
  const [date,     setDate]     = useState('');
  const [detail,   setDetail]   = useState(null);   // selected record for detail modal
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [visits,   setVisits]   = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch list ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await triageAPI.getAll({
        page, limit,
        search:   debounced || undefined,
        priority: priority  || undefined,
        date:     date      || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load triage records');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, priority, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, priority, date]);

  // ── open form modal ───────────────────────────────────────────────
  const openForm = async () => {
    setShowForm(true);
    try {
      const res = await patientsAPI.getAll({ limit: 300 });
      setPatients(res.data?.data ?? []);
    } catch { toast.error('Failed to load patients'); }
  };

  // when patient selected → load their open visits
  const handlePatientChange = async (patientId) => {
    setForm(f => ({ ...f, patientId, visitId: '' }));
    if (!patientId) { setVisits([]); return; }
    try {
      // Load both OPEN and IN_PROGRESS visits so triage can be recorded
      const res = await opdAPI.getAll({ patientId, limit: 50 });
      const activeVisits = (res.data?.data ?? []).filter(v =>
        ['OPEN', 'IN_PROGRESS'].includes(v.status)
      );
      setVisits(activeVisits);
    } catch { setVisits([]); }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setVisits([]);
  };

  // ── BMI live calculation ──────────────────────────────────────────
  const calcBMI = () => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    if (w > 0 && h > 0) {
      const hm = h / 100;
      return (w / (hm * hm)).toFixed(1);
    }
    return null;
  };

  // ── submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error('Select a patient'); return; }
    if (!form.visitId)   { toast.error('Select a visit');   return; }
    setSaving(true);
    try {
      await triageAPI.create(form);
      toast.success('Triage recorded — consultation bill created automatically');
      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to record triage');
    } finally { setSaving(false); }
  };

  // ── table columns ─────────────────────────────────────────────────
  const columns = [
    {
      key: 'createdAt', label: 'Date & Time', sortable: true,
      render: (v) => (
        <div>
          <div className="font-medium">{new Date(v).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
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
      key: 'priority', label: 'Priority',
      render: (v) => <PriorityBadge priority={v} />,
    },
    {
      key: 'temperature', label: 'Temp (°C)',
      render: (v) => v ? (
        <span className={parseFloat(v) > 37.5 ? 'text-red-600 font-medium' : ''}>{v}</span>
      ) : '—',
    },
    {
      key: 'bloodPressureSystolic', label: 'BP (mmHg)',
      render: (_, r) => r.bloodPressureSystolic
        ? `${r.bloodPressureSystolic}/${r.bloodPressureDiastolic}`
        : '—',
    },
    {
      key: 'pulseRate', label: 'Pulse',
      render: (v) => v ? `${v} bpm` : '—',
    },
    {
      key: 'oxygenSaturation', label: 'SpO₂',
      render: (v) => v ? (
        <span className={parseFloat(v) < 95 ? 'text-red-600 font-medium' : ''}>{v}%</span>
      ) : '—',
    },
    {
      key: 'nurse', label: 'Recorded By',
      render: (_, r) => r.nurse ? `${r.nurse.firstName} ${r.nurse.lastName}` : '—',
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDetail(r)}
            className="text-xs text-primary-600 hover:underline font-medium"
          >
            View
          </button>
          {r.visit?.id && (
            <BillLink visitId={r.visit.id} />
          )}
        </div>
      ),
    },
  ];

  const bmi = calcBMI();

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Triage</h1>
          <p className="page-subtitle">Record and review patient vitals and priority</p>
        </div>
        <button onClick={openForm} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Record Triage
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search patient name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
          />
          <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage}
        emptyText="No triage records found"
      />

      {/* ── Record Triage Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title="Record Triage"
        size="lg"
        footer={
          <>
            <button onClick={closeForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Triage'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Patient & Visit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Patient *</label>
              <select
                className="input"
                value={form.patientId}
                onChange={e => handlePatientChange(e.target.value)}
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
              <label className="label">Visit *</label>
              <select
                className="input"
                value={form.visitId}
                onChange={e => setForm(f => ({ ...f, visitId: e.target.value }))}
                required
                disabled={!form.patientId}
              >
                <option value="">Select visit...</option>
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.visitNo} — {new Date(v.visitDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {form.patientId && visits.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No open visits for this patient.</p>
              )}
            </div>
          </div>

          {/* Vitals */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <HeartIcon className="w-4 h-4 text-red-500" /> Vital Signs
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'temperature',           label: 'Temperature (°C)', placeholder: '36.5' },
                { key: 'bloodPressureSystolic',  label: 'BP Systolic',     placeholder: '120'  },
                { key: 'bloodPressureDiastolic', label: 'BP Diastolic',    placeholder: '80'   },
                { key: 'pulseRate',              label: 'Pulse Rate (bpm)', placeholder: '72'  },
                { key: 'respiratoryRate',        label: 'Resp. Rate (/min)',placeholder: '18'  },
                { key: 'oxygenSaturation',       label: 'SpO₂ (%)',        placeholder: '98'   },
              ].map(field => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Anthropometrics */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <BeakerIcon className="w-4 h-4 text-blue-500" /> Anthropometrics
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  type="number" step="0.1" className="input" placeholder="65"
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input
                  type="number" step="0.1" className="input" placeholder="170"
                  value={form.height}
                  onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">BMI (auto)</label>
                <div className={`input flex items-center font-semibold ${
                  bmi ? (parseFloat(bmi) < 18.5 || parseFloat(bmi) > 30
                    ? 'text-orange-600' : 'text-green-600') : 'text-gray-400'
                }`}>
                  {bmi ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Diagnosis</label>
              <textarea
                className="input" rows={3}
                placeholder="Initial triage diagnosis..."
                value={form.diagnosis}
                onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Priority *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          form.priority === p.value
                            ? `${p.cls} border-2`
                            : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input" rows={2}
                  placeholder="Additional notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Detail Modal ── */}
      {detail && (
        <Modal
          isOpen={!!detail}
          onClose={() => setDetail(null)}
          title={`Triage — ${detail.patient?.firstName} ${detail.patient?.lastName}`}
          size="md"
          footer={
            <button onClick={() => setDetail(null)} className="btn-secondary">Close</button>
          }
        >
          <div className="space-y-4">
            {/* Priority */}
            <div className="flex items-center gap-3">
              <PriorityBadge priority={detail.priority} />
              <span className="text-sm text-gray-500">
                {new Date(detail.createdAt).toLocaleString()}
                {detail.nurse && ` · by ${detail.nurse.firstName} ${detail.nurse.lastName}`}
              </span>
            </div>

            {/* Vitals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <VitalField label="Temperature"    value={detail.temperature}        unit="°C"
                warning={detail.temperature && parseFloat(detail.temperature) > 37.5} />
              <VitalField label="Blood Pressure" value={detail.bloodPressureSystolic
                ? `${detail.bloodPressureSystolic}/${detail.bloodPressureDiastolic}` : null} unit="mmHg"
                warning={detail.bloodPressureSystolic > 140 || detail.bloodPressureDiastolic > 90} />
              <VitalField label="Pulse Rate"     value={detail.pulseRate}          unit="bpm"
                warning={detail.pulseRate && (detail.pulseRate < 60 || detail.pulseRate > 100)} />
              <VitalField label="Resp. Rate"     value={detail.respiratoryRate}    unit="/min"
                warning={detail.respiratoryRate && (detail.respiratoryRate < 12 || detail.respiratoryRate > 20)} />
              <VitalField label="SpO₂"           value={detail.oxygenSaturation ? `${detail.oxygenSaturation}%` : null}
                warning={detail.oxygenSaturation && parseFloat(detail.oxygenSaturation) < 95} />
              <VitalField label="BMI"            value={detail.bmi} />
            </div>

            {/* Anthropometrics */}
            <div className="grid grid-cols-2 gap-3">
              <VitalField label="Weight" value={detail.weight} unit="kg" />
              <VitalField label="Height" value={detail.height} unit="cm" />
            </div>

            {/* Complaint & Notes */}
            {detail.diagnosis && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {detail.diagnosis}
                </p>
              </div>
            )}
            {detail.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {detail.notes}
                </p>
              </div>
            )}

            {/* Visit link */}
            {detail.visit && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <span className="text-sm text-gray-500">Related Visit</span>
                <button
                  onClick={() => { setDetail(null); navigate(`/opd/${detail.visitId}`); }}
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  {detail.visit.visitNo} →
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
