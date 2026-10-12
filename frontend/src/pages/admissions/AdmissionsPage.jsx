import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, BuildingOfficeIcon, CheckCircleIcon,
  ArrowsRightLeftIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import { admissionsAPI } from '@api/admissions.api';
import { patientsAPI }   from '@api/patients.api';
import { wardsAPI }      from '@api/wards.api';
import { opdAPI }        from '@api/opd.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUSES = ['ACTIVE','DISCHARGED','TRANSFERRED'];

const EMPTY_ADMIT = { patientId:'', visitId:'', wardId:'', bedId:'', diagnosis:'', expectedDischarge:'' };
const EMPTY_DC    = { dischargeNote:'' };
const EMPTY_TX    = { newWardId:'', newBedId:'' };

export default function AdmissionsPage() {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('ACTIVE');
  const [wardId,   setWardId]   = useState('');
  const [wards,    setWards]    = useState([]);
  const [patients, setPatients] = useState([]);
  const [beds,     setBeds]     = useState([]);
  const [visits,   setVisits]   = useState([]);
  const [txBeds,   setTxBeds]   = useState([]);

  const [showAdmit, setShowAdmit] = useState(false);
  const [showDc,    setShowDc]    = useState(false);
  const [showTx,    setShowTx]    = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [admitForm, setAdmitForm] = useState(EMPTY_ADMIT);
  const [dcForm,    setDcForm]    = useState(EMPTY_DC);
  const [txForm,    setTxForm]    = useState(EMPTY_TX);
  const [saving,    setSaving]    = useState(false);

  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admissionsAPI.getAll({
        page, limit,
        search: debounced || undefined,
        status: status    || undefined,
        wardId: wardId    || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch { toast.error('Failed to load admissions'); }
    finally  { setLoading(false); }
  }, [page, limit, debounced, status, wardId]);

  const fetchWards = useCallback(async () => {
    try {
      const res = await wardsAPI.getAll({ limit: 100 });
      setWards(res.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData();  }, [fetchData]);
  useEffect(() => { fetchWards(); }, [fetchWards]);
  useEffect(() => { resetPage();  }, [debounced, status, wardId]);

  // ── admit modal ───────────────────────────────────────────────────
  const openAdmit = async () => {
    setShowAdmit(true);
    try {
      const res = await patientsAPI.getAll({ limit: 300 });
      setPatients(res.data?.data ?? []);
    } catch { toast.error('Failed to load patients'); }
  };

  const handlePatientChange = async (patientId) => {
    setAdmitForm(f => ({ ...f, patientId, visitId: '' }));
    setVisits([]);
    if (!patientId) return;
    try {
      // Load all active visits — OPEN, IN_PROGRESS, PENDING_LAB, PENDING_PHARMACY
      const res = await opdAPI.getAll({ patientId, limit: 50 });
      const active = (res.data?.data ?? []).filter(v =>
        ['OPEN','IN_PROGRESS','PENDING_LAB','PENDING_PHARMACY'].includes(v.status)
      );
      setVisits(active);
    } catch { /* silent */ }
  };

  const handleWardChange = async (wId) => {
    setAdmitForm(f => ({ ...f, wardId: wId, bedId: '' }));
    setBeds([]);
    if (!wId) return;
    try {
      const res = await wardsAPI.getBeds(wId);
      setBeds((res.data?.data ?? []).filter(b => b.status === 'AVAILABLE'));
    } catch { /* silent */ }
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!admitForm.patientId || !admitForm.wardId || !admitForm.bedId) {
      toast.error('Patient, ward and bed are required'); return;
    }
    setSaving(true);
    try {
      await admissionsAPI.create(admitForm);
      toast.success('Patient admitted successfully');
      setShowAdmit(false);
      setAdmitForm(EMPTY_ADMIT);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to admit patient');
    } finally { setSaving(false); }
  };

  // ── discharge ─────────────────────────────────────────────────────
  const openDischarge = (admission) => { setSelected(admission); setShowDc(true); };

  const handleDischarge = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await admissionsAPI.discharge(selected.id, dcForm);
      toast.success('Patient discharged');
      setShowDc(false);
      setDcForm(EMPTY_DC);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to discharge');
    } finally { setSaving(false); }
  };

  // ── transfer ──────────────────────────────────────────────────────
  const openTransfer = async (admission) => {
    setSelected(admission);
    setTxForm(EMPTY_TX);
    setTxBeds([]);
    setShowTx(true);
  };

  const handleTxWardChange = async (wId) => {
    setTxForm(f => ({ ...f, newWardId: wId, newBedId: '' }));
    setTxBeds([]);
    if (!wId) return;
    try {
      const res = await wardsAPI.getBeds(wId);
      setTxBeds((res.data?.data ?? []).filter(b => b.status === 'AVAILABLE'));
    } catch { /* silent */ }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!txForm.newWardId || !txForm.newBedId) {
      toast.error('Select ward and bed'); return;
    }
    setSaving(true);
    try {
      await admissionsAPI.transfer(selected.id, txForm);
      toast.success('Patient transferred');
      setShowTx(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to transfer');
    } finally { setSaving(false); }
  };

  // ── stay duration ─────────────────────────────────────────────────
  const daysSince = (date) => {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    return d === 0 ? 'Today' : `${d}d`;
  };

  // ── columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'admissionNo', label: 'Adm. No', sortable: true,
      render: (v) => <span className="font-mono text-xs font-semibold text-primary-600">{v}</span>,
    },
    {
      key: 'admissionDate', label: 'Date',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'patient', label: 'Patient',
      render: (_, r) => r.patient ? (
        <div>
          <div className="font-medium">{r.patient.firstName} {r.patient.lastName}</div>
          <div className="text-xs text-gray-400">{r.patient.patientId} · {r.patient.gender}</div>
        </div>
      ) : '—',
    },
    {
      key: 'ward', label: 'Ward / Bed',
      render: (_, r) => r.ward ? (
        <div>
          <div className="font-medium">{r.ward.name}</div>
          <div className="text-xs text-gray-400">Bed {r.bed?.bedNumber}</div>
        </div>
      ) : '—',
    },
    {
      key: 'doctor', label: 'Doctor',
      render: (_, r) => r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '—',
    },
    {
      key: 'admissionDate', label: 'Stay',
      render: (v, r) => r.status === 'ACTIVE' ? (
        <span className="badge badge-blue">{daysSince(v)}</span>
      ) : '—',
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => r.status === 'ACTIVE' ? (
        <div className="flex items-center gap-1">
          <button onClick={() => openDischarge(r)} title="Discharge"
            className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 inline-flex">
            <CheckCircleIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openTransfer(r)} title="Transfer"
            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 inline-flex">
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
        </div>
      ) : null,
    },
  ];

  const activeCount = data.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admissions</h1>
          <p className="page-subtitle">
            {activeCount} patient{activeCount !== 1 ? 's' : ''} currently admitted
          </p>
        </div>
        <button onClick={openAdmit} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Admit Patient
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" className="input" placeholder="Search admission no or patient..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={wardId} onChange={e => setWardId(e.target.value)}>
            <option value="">All Wards</option>
            {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No admissions found"
      />

      {/* Admit Modal */}
      <Modal isOpen={showAdmit} onClose={() => setShowAdmit(false)}
        title="Admit Patient" size="md"
        footer={
          <>
            <button onClick={() => setShowAdmit(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdmit} disabled={saving} className="btn-primary">
              {saving ? 'Admitting...' : 'Admit Patient'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdmit} className="space-y-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" value={admitForm.patientId}
              onChange={e => handlePatientChange(e.target.value)} required>
              <option value="">Select patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.patientId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">OPD Visit</label>
            <select className="input" value={admitForm.visitId}
              onChange={e => setAdmitForm(f => ({ ...f, visitId: e.target.value }))}
              disabled={!admitForm.patientId}>
              <option value="">Select visit (optional)...</option>
              {visits.map(v => (
                <option key={v.id} value={v.id}>
                  {v.visitNo} — {new Date(v.visitDate).toLocaleDateString()} [{v.status}]
                </option>
              ))}
            </select>
            {admitForm.patientId && visits.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                No active visits found. Create an OPD visit first, or admit without a visit.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ward *</label>
              <select className="input" value={admitForm.wardId}
                onChange={e => handleWardChange(e.target.value)} required>
                <option value="">Select ward...</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.availableBeds ?? '?'} available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Bed *</label>
              <select className="input" value={admitForm.bedId}
                onChange={e => setAdmitForm(f => ({ ...f, bedId: e.target.value }))}
                disabled={!admitForm.wardId} required>
                <option value="">Select bed...</option>
                {beds.map(b => <option key={b.id} value={b.id}>{b.bedNumber}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Admitting Diagnosis</label>
            <textarea className="input" rows={2} placeholder="Diagnosis at time of admission..."
              value={admitForm.diagnosis}
              onChange={e => setAdmitForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </div>
          <div>
            <label className="label">Expected Discharge Date</label>
            <input type="date" className="input"
              value={admitForm.expectedDischarge}
              onChange={e => setAdmitForm(f => ({ ...f, expectedDischarge: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal isOpen={showDc} onClose={() => setShowDc(false)}
        title={`Discharge — ${selected?.patient?.firstName} ${selected?.patient?.lastName}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowDc(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDischarge} disabled={saving} className="btn-success">
              {saving ? 'Processing...' : 'Confirm Discharge'}
            </button>
          </>
        }
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
            Ward: <strong>{selected?.ward?.name}</strong> · Bed: <strong>{selected?.bed?.bedNumber}</strong>
            <br />Admitted: <strong>{selected?.admissionDate ? new Date(selected.admissionDate).toLocaleDateString() : '—'}</strong>
          </div>
          <div>
            <label className="label">Discharge Note</label>
            <textarea className="input" rows={4} placeholder="Summary, follow-up instructions..."
              value={dcForm.dischargeNote}
              onChange={e => setDcForm(f => ({ ...f, dischargeNote: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTx} onClose={() => setShowTx(false)}
        title={`Transfer — ${selected?.patient?.firstName} ${selected?.patient?.lastName}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowTx(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleTransfer} disabled={saving} className="btn-primary">
              {saving ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            Current: <strong>{selected?.ward?.name}</strong> · Bed <strong>{selected?.bed?.bedNumber}</strong>
          </div>
          <div>
            <label className="label">New Ward *</label>
            <select className="input" value={txForm.newWardId}
              onChange={e => handleTxWardChange(e.target.value)} required>
              <option value="">Select ward...</option>
              {wards.filter(w => w.id !== selected?.wardId).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">New Bed *</label>
            <select className="input" value={txForm.newBedId}
              onChange={e => setTxForm(f => ({ ...f, newBedId: e.target.value }))}
              disabled={!txForm.newWardId} required>
              <option value="">Select available bed...</option>
              {txBeds.map(b => <option key={b.id} value={b.id}>{b.bedNumber}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
