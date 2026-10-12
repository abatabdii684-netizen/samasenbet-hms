import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import Modal from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, CalendarDaysIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import { appointmentsAPI } from '@api/appointments.api';
import { patientsAPI }     from '@api/patients.api';
import { employeesAPI }    from '@api/employees.api';
import { usePagination }   from '@hooks/usePagination';
import { useDebounce }     from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const CLINIC_TYPES = [
  'GENERAL_OPD', 'INTERNAL_MEDICINE', 'SURGERY', 'GYNECOLOGY',
  'PEDIATRICS', 'EYE_CLINIC', 'PHYSIOTHERAPY',
];

const STATUS_OPTIONS = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

const STATUS_ACTIONS = {
  SCHEDULED:   [{ label: 'Confirm',   status: 'CONFIRMED',   icon: CheckCircleIcon, cls: 'text-blue-600'  },
                { label: 'Cancel',    status: 'CANCELLED',   icon: XCircleIcon,     cls: 'text-red-600'   }],
  CONFIRMED:   [{ label: 'Start',     status: 'IN_PROGRESS', icon: ClockIcon,       cls: 'text-yellow-600'},
                { label: 'No Show',   status: 'NO_SHOW',     icon: XCircleIcon,     cls: 'text-gray-600'  }],
  IN_PROGRESS: [{ label: 'Complete',  status: 'COMPLETED',   icon: CheckCircleIcon, cls: 'text-green-600' }],
};

function AppointmentsPage() {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [clinic,   setClinic]   = useState('');
  const [date,     setDate]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  const [form, setForm] = useState({
    patientId: '', doctorId: '', clinicType: 'GENERAL_OPD',
    scheduledAt: '', duration: 15, reason: '',
  });

  // ── fetch list ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll({
        page, limit,
        search:     debounced   || undefined,
        status:     status      || undefined,
        clinicType: clinic      || undefined,
        date:       date        || undefined,
      });
      const d = res.data;
      setData(d.data  || []);
      setTotal(d.meta?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, status, clinic, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, status, clinic, date]);

  // ── load patients & doctors for the form ────────────────────────
  const openModal = async () => {
    setShowModal(true);
    try {
      const [pRes, eRes] = await Promise.all([
        patientsAPI.getAll({ limit: 200 }),
        employeesAPI.getAll({ limit: 200, status: 'ACTIVE' }),
      ]);
      setPatients(pRes.data.data || []);
      const allEmps = eRes.data.data || [];
      setDoctors(allEmps.filter(e =>
        e.jobTitle?.toLowerCase().includes('doctor') ||
        e.jobTitle?.toLowerCase().includes('physician') ||
        e.jobTitle?.toLowerCase().includes('specialist') ||
        e.jobTitle?.toLowerCase().includes('surgeon') ||
        e.jobTitle?.toLowerCase().includes('consultant')
      ).length > 0
        ? allEmps.filter(e =>
            e.jobTitle?.toLowerCase().includes('doctor') ||
            e.jobTitle?.toLowerCase().includes('physician') ||
            e.jobTitle?.toLowerCase().includes('specialist') ||
            e.jobTitle?.toLowerCase().includes('surgeon') ||
            e.jobTitle?.toLowerCase().includes('consultant')
          )
        : allEmps  // show all employees if no doctors found
      );
    } catch {
      toast.error('Failed to load form data');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ patientId: '', doctorId: '', clinicType: 'GENERAL_OPD', scheduledAt: '', duration: 15, reason: '' });
  };

  // ── create appointment ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.scheduledAt) {
      toast.error('Patient, doctor and date/time are required');
      return;
    }
    setSaving(true);
    try {
      await appointmentsAPI.create(form);
      toast.success('Appointment booked successfully');
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  // ── update status ───────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await appointmentsAPI.updateStatus(id, newStatus);
      toast.success(`Appointment marked as ${newStatus.toLowerCase().replace('_', ' ')}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── columns ─────────────────────────────────────────────────────
  const columns = [
    {
      key: 'appointmentNo', label: 'Appt. No', sortable: true,
      render: (v) => <span className="font-mono text-xs font-medium text-primary-600">{v}</span>,
    },
    {
      key: 'scheduledAt', label: 'Date & Time', sortable: true,
      render: (v) => v ? (
        <div>
          <div className="font-medium">{new Date(v).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
      key: 'doctor', label: 'Doctor',
      render: (_, r) => r.doctor
        ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}`
        : '—',
    },
    {
      key: 'clinicType', label: 'Clinic',
      render: (v) => <span className="capitalize text-xs">{v?.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'duration', label: 'Duration',
      render: (v) => `${v} min`,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          {/* view patient */}
          <button
            onClick={() => navigate(`/patients/${r.patientId}`)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600"
            title="View Patient"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {/* status actions */}
          {(STATUS_ACTIONS[r.status] || []).map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(r.id, action.status)}
              className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${action.cls}`}
              title={action.label}
            >
              <action.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Schedule and manage patient appointments</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search patient or appt no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select className="input" value={clinic} onChange={(e) => setClinic(e.target.value)}>
            <option value="">All Clinics</option>
            {CLINIC_TYPES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage}
        emptyText="No appointments found"
      />

      {/* New Appointment Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Book New Appointment"
        size="md"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Booking...' : 'Book Appointment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient */}
          <div>
            <label className="label">Patient *</label>
            <select
              className="input"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              required
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.patientId}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className="label">Doctor *</label>
            <select
              className="input"
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              required
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName} — {d.jobTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Clinic type */}
          <div>
            <label className="label">Clinic Type *</label>
            <select
              className="input"
              value={form.clinicType}
              onChange={(e) => setForm({ ...form, clinicType: e.target.value })}
            >
              {CLINIC_TYPES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date & Time *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                className="input"
                value={form.duration}
                min={5} max={120}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="label">Reason / Chief Complaint</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Reason for visit..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AppointmentsPage;
