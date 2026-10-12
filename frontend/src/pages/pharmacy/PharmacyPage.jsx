import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  ShoppingBagIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, EyeIcon,
} from '@heroicons/react/24/outline';
import { pharmacyAPI }   from '@api/pharmacy.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED'];

function StatCard({ icon: Icon, label, value, color }) {
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

export default function PharmacyPage() {
  const [data,       setData]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [lowStock,   setLowStock]   = useState([]);
  const [expiring,   setExpiring]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [selected,   setSelected]   = useState(null); // prescription for detail modal
  const [dispensing, setDispensing] = useState(false);
  const [tab,        setTab]        = useState('prescriptions'); // prescriptions | alerts
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch prescriptions ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyAPI.getAll({
        page, limit,
        search: debounced || undefined,
        status: status    || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally { setLoading(false); }
  }, [page, limit, debounced, status]);

  // ── fetch alerts ─────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const [lRes, eRes] = await Promise.all([
        pharmacyAPI.getLowStock(),
        pharmacyAPI.getExpiring(30),
      ]);
      setLowStock(lRes.data?.data ?? []);
      setExpiring(eRes.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); },  [fetchData]);
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { resetPage(); },  [debounced, status]);

  // ── open prescription detail ─────────────────────────────────────
  const openDetail = async (rx) => {
    try {
      const res = await pharmacyAPI.getById(rx.id);
      setSelected(res.data?.data);
    } catch { toast.error('Failed to load prescription'); }
  };

  // ── dispense ─────────────────────────────────────────────────────
  const handleDispense = async () => {
    if (!selected) return;
    if (!window.confirm(`Dispense prescription ${selected.prescriptionNo}? This will deduct stock.`)) return;
    setDispensing(true);
    try {
      await pharmacyAPI.dispense(selected.id);
      toast.success('Medications dispensed successfully');
      setSelected(null);
      fetchData();
      fetchAlerts();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to dispense');
    } finally { setDispensing(false); }
  };

  // ── stats from current page data ─────────────────────────────────
  const stats = data.reduce((acc, rx) => {
    if (rx.status === 'PENDING')              acc.pending++;
    if (rx.status === 'DISPENSED')            acc.dispensed++;
    if (rx.status === 'PARTIALLY_DISPENSED')  acc.partial++;
    return acc;
  }, { pending: 0, dispensed: 0, partial: 0 });

  // ── columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'prescriptionNo', label: 'Rx No', sortable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-primary-600">{v}</span>
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
      key: 'doctor', label: 'Doctor',
      render: (_, r) => r.doctor
        ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}`
        : '—',
    },
    {
      key: 'items', label: 'Drugs',
      render: (v) => (
        <span className="badge badge-blue">{v?.length ?? 0} item(s)</span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'dispensedAt', label: 'Dispensed',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <button
          onClick={() => openDetail(r)}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                     text-gray-400 hover:text-primary-600 inline-flex"
          title="View"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmacy</h1>
          <p className="page-subtitle">Prescriptions, dispensing and drug management</p>
        </div>
        <Link to="/pharmacy/drugs" className="btn-secondary">
          <ShoppingBagIcon className="w-4 h-4" /> Drug Catalog
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ClockIcon}              label="Pending"    value={stats.pending}   color="text-yellow-600 bg-yellow-50" />
        <StatCard icon={CheckCircleIcon}        label="Dispensed"  value={stats.dispensed} color="text-green-600  bg-green-50"  />
        <StatCard icon={ShoppingBagIcon}        label="Partial"    value={stats.partial}   color="text-blue-600   bg-blue-50"   />
        <StatCard icon={ExclamationTriangleIcon} label="Low Stock" value={lowStock.length} color="text-red-600    bg-red-50"    />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {[
            { key: 'prescriptions', label: 'Prescriptions' },
            { key: 'alerts',        label: `Alerts (${lowStock.length + expiring.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'prescriptions' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" className="input"
                placeholder="Search Rx no or patient name..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={columns} data={data} loading={loading}
            pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
            onPageChange={goToPage} emptyText="No prescriptions found"
          />
        </>
      )}

      {tab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Low Stock */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                Low Stock Drugs ({lowStock.length})
              </h3>
            </div>
            {lowStock.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">All drugs adequately stocked</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Drug</th><th>Current Stock</th><th>Reorder Level</th></tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {lowStock.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="font-medium">{d.genericName}</div>
                          <div className="text-xs text-gray-400">{d.drugCode}</div>
                        </td>
                        <td className="text-red-600 font-semibold">{d.totalStock} {d.unit}</td>
                        <td className="text-gray-500">{d.reorderLevel} {d.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expiring Soon */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                Expiring Within 30 Days ({expiring.length})
              </h3>
            </div>
            {expiring.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No drugs expiring soon</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Drug</th><th>Batch</th><th>Qty</th><th>Expiry</th></tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {expiring.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="font-medium">{s.drug?.genericName}</div>
                          <div className="text-xs text-gray-400">{s.drug?.drugCode}</div>
                        </td>
                        <td className="text-xs">{s.batchNumber}</td>
                        <td>{s.quantity}</td>
                        <td className="text-orange-600 font-medium text-sm">
                          {new Date(s.expiryDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Prescription — ${selected.prescriptionNo}`}
          size="lg"
          footer={
            <div className="flex justify-between w-full">
              <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
              {selected.status === 'PENDING' && (
                <button onClick={handleDispense} disabled={dispensing} className="btn-success">
                  {dispensing ? 'Dispensing...' : 'Dispense Medications'}
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Patient</p>
                <p className="font-semibold">{selected.patient?.firstName} {selected.patient?.lastName}</p>
                <p className="text-xs text-gray-400">{selected.patient?.patientId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-semibold">
                  {selected.doctor ? `Dr. ${selected.doctor.firstName} ${selected.doctor.lastName}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              {selected.dispensedAt && (
                <div>
                  <p className="text-xs text-gray-500">Dispensed</p>
                  <p className="font-medium">{new Date(selected.dispensedAt).toLocaleString()}</p>
                </div>
              )}
              {selected.pharmacist && (
                <div>
                  <p className="text-xs text-gray-500">Pharmacist</p>
                  <p className="font-medium">
                    {selected.pharmacist.firstName} {selected.pharmacist.lastName}
                  </p>
                </div>
              )}
            </div>

            {/* Drug items */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="table">
                <thead>
                  <tr>
                    <th>Drug</th><th>Dosage</th><th>Frequency</th>
                    <th>Duration</th><th>Qty</th><th>Dispensed</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {selected.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.drug?.genericName}</div>
                        <div className="text-xs text-gray-400">
                          {item.drug?.brandName} · {item.drug?.strength}
                        </div>
                      </td>
                      <td className="text-sm">{item.dosage}</td>
                      <td className="text-sm">{item.frequency}</td>
                      <td className="text-sm">{item.duration}</td>
                      <td className="font-semibold">{item.quantity}</td>
                      <td>
                        {item.dispensedQty > 0
                          ? <span className="text-green-600 font-semibold">{item.dispensedQty}</span>
                          : <span className="text-gray-400 text-xs">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
