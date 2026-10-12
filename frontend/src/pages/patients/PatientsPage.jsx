import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable  from '@components/common/DataTable';
import SearchInput from '@components/common/SearchInput';
import Modal       from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, EyeIcon, HeartIcon, ClipboardDocumentListIcon,
  BeakerIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useDebounce }   from '@hooks/useDebounce';
import { usePagination } from '@hooks/usePagination';
import { patientsAPI }   from '@api/patients.api';
import { opdAPI }        from '@api/opd.api';
import { employeesAPI }  from '@api/employees.api';
import toast from 'react-hot-toast';

const CLINIC_TYPES = [
  'GENERAL_OPD','INTERNAL_MEDICINE','SURGERY','GYNECOLOGY',
  'PEDIATRICS','PHYSIOTHERAPY','EYE_CLINIC',
];

const EMPTY_VISIT_FORM = {
  doctorId: '', clinicType: 'GENERAL_OPD',
  patientType: 'OPD', chiefComplaint: '',
};

function PatientsPage() {
  const navigate = useNavigate();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // OPD visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitForm, setVisitForm] = useState(EMPTY_VISIT_FORM);
  const [doctors, setDoctors] = useState([]);
  const [visitSaving, setVisitSaving] = useState(false);
  const [redirectTo, setRedirectTo] = useState('opd'); // 'opd' | 'triage'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientsAPI.getAll({
        page, limit, search: debounced || undefined,
        isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      });
      const d = res.data;
      setData(d.data || []);
      setTotal(d.meta?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, status]);

  // Load doctors when modal opens
  const openVisitModal = async (patient, target) => {
    setSelectedPatient(patient);
    setRedirectTo(target);
    setVisitForm(EMPTY_VISIT_FORM);
    setShowVisitModal(true);
    if (doctors.length === 0) {
      try {
        const res = await employeesAPI.getAll({ limit: 200, status: 'ACTIVE' });
        setDoctors(res.data?.data ?? []);
      } catch { /* silent */ }
    }
  };

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.doctorId) { toast.error('Select a doctor'); return; }
    setVisitSaving(true);
    try {
      const res = await opdAPI.create({
        patientId:      selectedPatient.id,
        doctorId:       parseInt(visitForm.doctorId),
        clinicType:     visitForm.clinicType,
        patientType:    visitForm.patientType,
        chiefComplaint: visitForm.chiefComplaint || undefined,
      });
      const visitId = res.data?.data?.id;
      toast.success(`Visit created for ${selectedPatient.firstName} ${selectedPatient.lastName}`);
      setShowVisitModal(false);
      if (redirectTo === 'triage') {
        navigate('/triage');
      } else {
        navigate(`/opd/${visitId}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create visit');
    } finally { setVisitSaving(false); }
  };

  const columns = [
    { key: 'patientId',   label: 'Patient ID',   sortable: true },
    { key: 'firstName',   label: 'Name',          render: (_, r) => `${r.firstName} ${r.lastName}` },
    { key: 'gender',      label: 'Gender',        render: (v) => <span className="capitalize">{v?.toLowerCase()}</span> },
    { key: 'phone',       label: 'Phone' },
    { key: 'dateOfBirth', label: 'Date of Birth', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'isActive',    label: 'Status',        render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          {/* View patient */}
          <Link to={`/patients/${r.id}`}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 inline-flex"
            title="View Patient">
            <EyeIcon className="w-4 h-4" />
          </Link>
          {/* Send to Triage */}
          <button
            onClick={() => openVisitModal(r, 'triage')}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 inline-flex"
            title="Create Visit → Send to Triage">
            <HeartIcon className="w-4 h-4" />
          </button>
          {/* Send to OPD */}
          <button
            onClick={() => openVisitModal(r, 'opd')}
            className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 inline-flex"
            title="Create Visit → Open in OPD">
            <ClipboardDocumentListIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Manage patient records and medical history</p>
        </div>
        <Link to="/patients/register" className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Register Patient
        </Link>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <EyeIcon className="w-3.5 h-3.5" /> View patient
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <HeartIcon className="w-3.5 h-3.5" /> Create visit → Triage
        </span>
        <span className="flex items-center gap-1 text-green-500">
          <ClipboardDocumentListIcon className="w-3.5 h-3.5" /> Create visit → OPD
        </span>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, or phone..." className="flex-1" />
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Patients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage}
        emptyText="No patients found"
      />

      {/* Create Visit Modal */}
      {showVisitModal && selectedPatient && (
        <Modal
          isOpen={showVisitModal}
          onClose={() => setShowVisitModal(false)}
          title={
            redirectTo === 'triage'
              ? `Create Visit → Send to Triage`
              : `Create Visit → Open in OPD`
          }
          size="md"
          footer={
            <>
              <button onClick={() => setShowVisitModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateVisit} disabled={visitSaving}
                className={redirectTo === 'triage' ? 'btn-danger' : 'btn-success'}>
                {visitSaving ? 'Creating...' : (
                  <span className="flex items-center gap-2">
                    {redirectTo === 'triage'
                      ? <><HeartIcon className="w-4 h-4" /> Create & Go to Triage</>
                      : <><ClipboardDocumentListIcon className="w-4 h-4" /> Create & Open OPD</>
                    }
                  </span>
                )}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateVisit} className="space-y-4">
            {/* Patient info */}
            <div className={`rounded-lg p-3 text-sm ${
              redirectTo === 'triage'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            }`}>
              <div className="flex items-center gap-2">
                {redirectTo === 'triage'
                  ? <HeartIcon className="w-4 h-4" />
                  : <ClipboardDocumentListIcon className="w-4 h-4" />
                }
                <span>
                  <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                  {' '}· {selectedPatient.patientId}
                  {' '}→ {redirectTo === 'triage' ? 'Triage' : 'OPD'}
                </span>
              </div>
            </div>

            {/* Doctor */}
            <div>
              <label className="label">Doctor *</label>
              <select className="input" value={visitForm.doctorId}
                onChange={e => setVisitForm(f => ({ ...f, doctorId: e.target.value }))} required>
                <option value="">Select doctor...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} — {d.jobTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Clinic type */}
            <div>
              <label className="label">Clinic Type</label>
              <select className="input" value={visitForm.clinicType}
                onChange={e => setVisitForm(f => ({ ...f, clinicType: e.target.value }))}>
                {CLINIC_TYPES.map(c => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Patient type */}
            <div>
              <label className="label">Patient Type</label>
              <select className="input" value={visitForm.patientType}
                onChange={e => setVisitForm(f => ({ ...f, patientType: e.target.value }))}>
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            {/* Chief complaint */}
            <div>
              <label className="label">Chief Complaint</label>
              <input type="text" className="input"
                placeholder="Brief complaint (optional)..."
                value={visitForm.chiefComplaint}
                onChange={e => setVisitForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PatientsPage;
