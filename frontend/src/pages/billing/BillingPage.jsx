import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, BanknotesIcon, ClockIcon,
  CheckCircleIcon, EyeIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { billingAPI }    from '@api/billing.api';
import { patientsAPI }   from '@api/patients.api';
import { opdAPI }        from '@api/opd.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUSES = ['DRAFT','FINALIZED','PARTIALLY_PAID','PAID','CANCELLED'];
const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [data,     setData]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [patients, setPatients] = useState([]);
  const [visits,   setVisits]   = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({
    patientId: '', visitId: '', discount: 0, tax: 0, notes: '', items: [],
  });
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: '', discount: 0 });

  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch bills ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getAll({
        page, limit,
        search: debounced || undefined,
        status: status    || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load bills');
    } finally { setLoading(false); }
  }, [page, limit, debounced, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, status]);

  // ── new bill modal ────────────────────────────────────────────────
  const openNew = async () => {
    setShowNew(true);
    try {
      const res = await patientsAPI.getAll({ limit: 300 });
      setPatients(res.data?.data ?? []);
    } catch { toast.error('Failed to load patients'); }
  };

  const handlePatientChange = async (patientId) => {
    setForm(f => ({ ...f, patientId, visitId: '' }));
    setVisits([]);
    if (!patientId) return;
    try {
      const res = await opdAPI.getAll({ patientId, limit: 50 });
      setVisits(res.data?.data ?? []);
    } catch { /* silent */ }
  };

  const closeNew = () => {
    setShowNew(false);
    setForm({ patientId: '', visitId: '', discount: 0, tax: 0, notes: '', items: [] });
    setNewItem({ description: '', quantity: 1, unitPrice: '', discount: 0 });
  };

  // ── add line item to form ─────────────────────────────────────────
  const addLineItem = () => {
    if (!newItem.description || !newItem.unitPrice) {
      toast.error('Description and unit price are required'); return;
    }
    setForm(f => ({ ...f, items: [...f.items, { ...newItem }] }));
    setNewItem({ description: '', quantity: 1, unitPrice: '', discount: 0 });
  };

  const removeLineItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  // ── subtotal preview ──────────────────────────────────────────────
  const subtotal = form.items.reduce(
    (s, i) => s + (parseFloat(i.unitPrice || 0) * parseInt(i.quantity || 1)) - parseFloat(i.discount || 0), 0
  );
  const grandTotal = subtotal - parseFloat(form.discount || 0) + parseFloat(form.tax || 0);

  const handleCreate = async () => {
    if (!form.patientId) { toast.error('Select a patient'); return; }
    if (form.items.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const res = await billingAPI.create(form);
      toast.success('Bill created');
      closeNew();
      navigate(`/billing/${res.data?.data?.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create bill');
    } finally { setSaving(false); }
  };

  // ── stats from page data ──────────────────────────────────────────
  const stats = data.reduce(
    (a, b) => {
      if (b.status === 'DRAFT')    a.draft++;
      if (b.status === 'FINALIZED' || b.status === 'PARTIALLY_PAID') a.pending++;
      if (b.status === 'PAID')     a.paid++;
      a.revenue += parseFloat(b.paidAmount || 0);
      return a;
    },
    { draft: 0, pending: 0, paid: 0, revenue: 0 }
  );

  // ── columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'billNo', label: 'Bill No', sortable: true,
      render: (v, r) => (
        <Link to={`/billing/${r.id}`}
          className="font-mono text-xs font-semibold text-primary-600 hover:underline">{v}</Link>
      ),
    },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: (v) => new Date(v).toLocaleDateString(),
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
      key: 'total', label: 'Total',
      render: (v) => <span className="font-semibold">{fmt(v)}</span>,
    },
    {
      key: 'paidAmount', label: 'Paid',
      render: (v) => <span className="text-green-600 font-medium">{fmt(v)}</span>,
    },
    {
      key: 'dueAmount', label: 'Due',
      render: (v) => parseFloat(v) > 0
        ? <span className="text-red-600 font-semibold">{fmt(v)}</span>
        : <span className="text-gray-400">—</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <Link to={`/billing/${r.id}`}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                     text-gray-400 hover:text-primary-600 inline-flex"
          title="View Bill">
          <EyeIcon className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Create bills, receive payments, track revenue</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ClockIcon}              label="Draft"    value={stats.draft}           color="text-gray-600   bg-gray-50"   />
        <StatCard icon={ExclamationTriangleIcon} label="Pending" value={stats.pending}          color="text-yellow-600 bg-yellow-50" />
        <StatCard icon={CheckCircleIcon}        label="Paid"     value={stats.paid}             color="text-green-600  bg-green-50"  />
        <StatCard icon={BanknotesIcon}          label="Revenue"  value={fmt(stats.revenue)}     color="text-blue-600   bg-blue-50"   />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" className="input"
            placeholder="Search bill no or patient name..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No bills found"
      />

      {/* New Bill Modal */}
      <Modal isOpen={showNew} onClose={closeNew} title="Create New Bill" size="xl"
        footer={
          <>
            <button onClick={closeNew} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Bill'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Patient & Visit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Patient *</label>
              <select className="input" value={form.patientId}
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
              <label className="label">Related Visit</label>
              <select className="input" value={form.visitId}
                onChange={e => setForm(f => ({ ...f, visitId: e.target.value }))}
                disabled={!form.patientId}>
                <option value="">None</option>
                {visits.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.visitNo} — {new Date(v.visitDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bill Items *
            </p>

            {/* Existing items */}
            {form.items.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                <table className="table text-sm">
                  <thead>
                    <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th><th></th></tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {form.items.map((item, idx) => {
                      const lineTotal = (parseFloat(item.unitPrice) * parseInt(item.quantity)) - parseFloat(item.discount || 0);
                      return (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>{fmt(item.unitPrice)}</td>
                          <td>{fmt(item.discount)}</td>
                          <td className="font-semibold">{fmt(lineTotal)}</td>
                          <td>
                            <button onClick={() => removeLineItem(idx)}
                              className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add new line item */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">Add Item</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <input type="text" className="input text-sm" placeholder="Description *"
                    value={newItem.description}
                    onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} />
                </div>
                <input type="number" className="input text-sm" placeholder="Qty" min="1"
                  value={newItem.quantity}
                  onChange={e => setNewItem(n => ({ ...n, quantity: e.target.value }))} />
                <input type="number" step="0.01" className="input text-sm" placeholder="Unit Price *"
                  value={newItem.unitPrice}
                  onChange={e => setNewItem(n => ({ ...n, unitPrice: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <input type="number" step="0.01" className="input text-sm w-32" placeholder="Discount"
                  value={newItem.discount}
                  onChange={e => setNewItem(n => ({ ...n, discount: e.target.value }))} />
                <button type="button" onClick={addLineItem} className="btn-secondary text-sm py-1.5">
                  <PlusIcon className="w-4 h-4" /> Add Line
                </button>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Discount (ETB)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tax (ETB)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={form.tax}
                onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {/* Grand total preview */}
          {form.items.length > 0 && (
            <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 text-right space-y-1">
              <div className="text-sm text-gray-500">Subtotal: <strong>{fmt(subtotal)}</strong></div>
              <div className="text-sm text-gray-500">Discount: <strong>-{fmt(form.discount)}</strong></div>
              <div className="text-sm text-gray-500">Tax: <strong>+{fmt(form.tax)}</strong></div>
              <div className="text-lg font-bold text-primary-700 dark:text-primary-300">
                Grand Total: {fmt(grandTotal)}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
