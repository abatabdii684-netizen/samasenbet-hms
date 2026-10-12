import React, { useState, useEffect, useCallback } from 'react';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { deliveryAPI } from '@api/delivery.api';
import { patientsAPI } from '@api/patients.api';
import { usePagination } from '@hooks/usePagination';
import toast from 'react-hot-toast';

const DELIVERY_TYPES  = ['NORMAL','CESAREAN','ASSISTED','OTHER'];
const MOTHER_STATUSES = ['STABLE','CRITICAL','DECEASED'];
const BABY_STATUSES   = ['ALIVE','STILLBORN','NEONATAL_DEATH'];

const EMPTY = {
  patientId:'', deliveryType:'NORMAL', deliveryDate:'',
  gestationalAge:'', babyWeight:'', babySex:'', apgarScore:'',
  motherStatus:'STABLE', babyStatus:'ALIVE', complications:'', notes:'',
};

export default function DeliveryPage() {
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState('');
  const [date,     setDate]     = useState('');
  const [patients, setPatients] = useState([]);
  const [showAdd,  setShowAdd]  = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getAll({
        page, limit,
        status: status || undefined,
        date:   date   || undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load delivery records'); }
    finally  { setLoading(false); }
  }, [page, limit, status, date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [status, date]);

  const openAdd = async () => {
    setShowAdd(true);
    try {
      const res = await patientsAPI.getAll({ limit: 300 });
      setPatients(res.data?.data ?? []);
    } catch { toast.error('Failed to load patients'); }
  };

  const openDetail = async (row) => {
    try {
      const res = await deliveryAPI.getById(row.id);
      setDetail(res.data?.data);
    } catch { toast.error('Failed to load record'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.deliveryDate) {
      toast.error('Patient and delivery date are required'); return;
    }
    setSaving(true);
    try {
      await deliveryAPI.create(form);
      toast.success('Delivery recorded');
      setShowAdd(false);
      setForm(EMPTY);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  const columns = [
    {
      key: 'deliveryNo', label: 'Delivery No',
      render: (v) => <span className="font-mono text-xs font-semibold text-primary-600">{v}</span>,
    },
    {
      key: 'deliveryDate', label: 'Date',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'patient', label: 'Mother',
      render: (_, r) => r.patient ? (
        <div>
          <div className="font-medium">{r.patient.firstName} {r.patient.lastName}</div>
          <div className="text-xs text-gray-400">{r.patient.patientId}</div>
        </div>
      ) : '—',
    },
    {
      key: 'deliveryType', label: 'Type',
      render: (v) => <span className="badge badge-blue">{v}</span>,
    },
    {
      key: 'babyWeight', label: 'Baby Weight',
      render: (v) => v ? `${v} kg` : '—',
    },
    {
      key: 'babySex', label: 'Baby Sex',
      render: (v) => v ? <span className="capitalize">{v.toLowerCase()}</span> : '—',
    },
    {
      key: 'motherStatus', label: 'Mother',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'babyStatus', label: 'Baby',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <button onClick={() => openDetail(r)}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 inline-flex">
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery Records</h1>
          <p className="page-subtitle">Manage maternity delivery records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Record Delivery
        </button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All</option>
            {MOTHER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No delivery records found"
      />

      {/* Record Delivery Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Record Delivery" size="lg"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Mother (Patient) *</label>
              <select className="input" value={form.patientId}
                onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required>
                <option value="">Select patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.patientId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Delivery Date *</label>
              <input type="datetime-local" className="input" value={form.deliveryDate}
                onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Delivery Type</label>
              <select className="input" value={form.deliveryType}
                onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value }))}>
                {DELIVERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gestational Age (weeks)</label>
              <input type="number" className="input" placeholder="40"
                value={form.gestationalAge}
                onChange={e => setForm(f => ({ ...f, gestationalAge: e.target.value }))} />
            </div>
            <div>
              <label className="label">Baby Weight (kg)</label>
              <input type="number" step="0.01" className="input" placeholder="3.2"
                value={form.babyWeight}
                onChange={e => setForm(f => ({ ...f, babyWeight: e.target.value }))} />
            </div>
            <div>
              <label className="label">Baby Sex</label>
              <select className="input" value={form.babySex}
                onChange={e => setForm(f => ({ ...f, babySex: e.target.value }))}>
                <option value="">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="label">APGAR Score</label>
              <input type="number" min="0" max="10" className="input" placeholder="8"
                value={form.apgarScore}
                onChange={e => setForm(f => ({ ...f, apgarScore: e.target.value }))} />
            </div>
            <div>
              <label className="label">Mother Status</label>
              <select className="input" value={form.motherStatus}
                onChange={e => setForm(f => ({ ...f, motherStatus: e.target.value }))}>
                {MOTHER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Baby Status</label>
              <select className="input" value={form.babyStatus}
                onChange={e => setForm(f => ({ ...f, babyStatus: e.target.value }))}>
                {BABY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Complications</label>
            <textarea className="input" rows={2} placeholder="Any complications..."
              value={form.complications}
              onChange={e => setForm(f => ({ ...f, complications: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detail && (
        <Modal isOpen={!!detail} onClose={() => setDetail(null)}
          title={`Delivery — ${detail.deliveryNo}`} size="md"
          footer={<button onClick={() => setDetail(null)} className="btn-secondary">Close</button>}
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Mother',         `${detail.patient?.firstName} ${detail.patient?.lastName}`],
              ['Date',           new Date(detail.deliveryDate).toLocaleString()],
              ['Type',           detail.deliveryType],
              ['Gestational Age',detail.gestationalAge ? `${detail.gestationalAge} weeks` : '—'],
              ['Baby Weight',    detail.babyWeight ? `${detail.babyWeight} kg` : '—'],
              ['Baby Sex',       detail.babySex || '—'],
              ['APGAR Score',    detail.apgarScore ?? '—'],
              ['Mother Status',  detail.motherStatus],
              ['Baby Status',    detail.babyStatus?.replace(/_/g,' ')],
              ['Attendant',      detail.attendant ? `${detail.attendant.firstName} ${detail.attendant.lastName}` : '—'],
            ].map(([lbl, val]) => (
              <div key={lbl} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500">{lbl}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{val}</p>
              </div>
            ))}
            {detail.complications && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Complications</p>
                <p className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {detail.complications}
                </p>
              </div>
            )}
            {detail.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">{detail.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
