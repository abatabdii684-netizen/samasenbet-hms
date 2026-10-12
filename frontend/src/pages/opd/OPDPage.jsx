import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable    from '@components/common/DataTable';
import Modal        from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { opdAPI }      from '@api/opd.api';
import { patientsAPI } from '@api/patients.api';
import { employeesAPI }from '@api/employees.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const CLINIC_TYPES = [
  'GENERAL_OPD','INTERNAL_MEDICINE','SURGERY','GYNECOLOGY',
  'PEDIATRICS','PHYSIOTHERAPY','EYE_CLINIC',
];
const STATUSES = ['OPEN','IN_PROGRESS','PENDING_LAB','PENDING_PHARMACY','ADMITTED','COMPLETED','REFERRED'];

const EMPTY_FORM = {
  patientId: '', doctorId: '', clinicType: 'GENERAL_OPD',
  patientType: 'OPD', chiefComplaint: '',
};

export default function OPDPage() {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [clinic,   setClinic]   = useState('');
  const [date,     setDate]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await opdAPI.getAll({
        page, limit,
        search:     debounced || undefined,
        status:     status    || undefined,
        clinicType: clinic    || undefined,
        date:       date      || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, status, clinic, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, status, clinic, date]);

  // ── new visit modal ───────────────────────────────────────────
  const openForm = async () => {
    setShowForm(true);
    try {
      const [pRes, eRes] = await Promise.all([
        patientsAPI.getAll({ limit: 300 }),
        employeesAPI.getAll({ limit: 200, status: 'ACTIVE' }),
      ]);
      setPatients(pRes.data?.data ?? []);
      // Filter employees who are doctors
      const all = eRes.data?.data ?? [];
      setDoctors(all.filter(e =>
        e.jobTitle?.toLowerCase().includes('doctor') ||
        e.jobTitle?.toLowerCase().includes('physician') ||
        e.jobTitle?.toLowerCase().includes('surgeon') ||
        e.jobTitle?.toLowerCase().includes('specialist')
      ).length > 0
        ? all.filter(e =>
            e.jobTitle?.toLowerCase().includes('doctor') ||
            e.jobTitle?.toLowerCase().includes('physician') ||
            e.jobTitle?.toLowerCase().includes('surgeon') ||
            e.jobTitle?.toLowerCase().includes('specialist')
          )
        : all // fallback: show all if no doctors found by title
      );
    } catch { toast.error('Failed to load form data'); }
  };

  const closeForm = () => { setShowForm(false); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error('Select a patient'); return; }
    setSaving(true);
    try {
      const res = await opdAPI.create(form);
      toast.success('Visit created');
      closeForm();
      navigate(`/opd/${res.data?.data?.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create visit');
    } finally { setSaving(false); }
  };

  // ── age helper ────────────────────────────────────────────────
  const calcAge = (dob) => dob
    ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
    : '—';

  // ── columns ───────────────────────────────────────────────────
  const columns = [
    {
      key: 'visitNo', label: 'Visit No', sortable: true,
      render: (v, r) => (
        <Link to={`/opd/${r.id}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">
          {v}
        </Link>
      ),
    },
    {
      key: 'visitDate', label: 'Date', sortable: true,
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'patient', label: 'Patient',
      render: (_, r) => r.patient ? (
        <div>
          <div className="font-medium">{r.patient.firstName} {r.patient.lastName}</div>
          <div className="text-xs text-gray-400">{r.patient.patientId} · {calcAge(r.patient.dateOfBirth)} yrs</div>
        </div>
      ) : '—',
    },
    {
      key: 'doctor', label: 'Doctor',
      render: (_, r) => r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '—',
    },
    {
      key: 'clinicType', label: 'Clinic',
      render: (v) => <span className="text-xs capitalize">{v?.replace(/_/g,' ')}</span>,
    },
    {
      key: 'triage', label: 'Triage',
      render: (v) => v
        ? <span className="badge badge-green">Done</span>
        : <span className="badge badge-yellow">Pending</span>,
    },
    {
      key: 'labOrderCount', label: 'Lab Orders',
      render: (_, r) => <span className="inline-flex min-w-7 justify-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-300">{r._count?.labOrders ?? 0}</span>,
    },
    {
      key: 'prescriptionCount', label: 'Prescriptions',
      render: (_, r) => <span className="inline-flex min-w-7 justify-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-300">{r._count?.prescriptions ?? 0}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <Link to={`/opd/${r.id}`}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 inline-flex"
          title="View Visit">
          <EyeIcon className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Visits</h1>
          <p className="page-subtitle">Outpatient visits, consultations and diagnoses</p>
        </div>
        <button onClick={openForm} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Visit
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" className="input" placeholder="Search visit no, patient..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <input type="date" className="input"
            value={date} onChange={e => setDate(e.target.value)} />
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select className="input" value={clinic} onChange={e => setClinic(e.target.value)}>
            <option value="">All Clinics</option>
            {CLINIC_TYPES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No visits found"
      />

      {/* New Visit Modal */}
      <Modal isOpen={showForm} onClose={closeForm} title="Create OPD Visit" size="md"
        footer={
          <>
            <button onClick={closeForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Visit'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
              <option value="">Select patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.patientId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Doctor</label>
            <select className="input" value={form.doctorId}
              onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
              <option value="">Auto-assign doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName} — {d.jobTitle}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Clinic Type</label>
              <select className="input" value={form.clinicType}
                onChange={e => setForm(f => ({ ...f, clinicType: e.target.value }))}>
                {CLINIC_TYPES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Patient Type</label>
              <select className="input" value={form.patientType}
                onChange={e => setForm(f => ({ ...f, patientType: e.target.value }))}>
                <option value="OPD">OPD</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Chief Complaint</label>
            <textarea className="input" rows={3} placeholder="Patient's main complaint..."
              value={form.chiefComplaint}
              onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
