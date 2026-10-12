import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@components/common/Badge';
import LoadingSpinner   from '@components/common/LoadingSpinner';
import SearchInput      from '@components/common/SearchInput';
import {
  BeakerIcon, ShoppingBagIcon, ClipboardDocumentListIcon,
  ArrowPathIcon, UserIcon,
} from '@heroicons/react/24/outline';
import { opdAPI }        from '@api/opd.api';
import { laboratoryAPI } from '@api/laboratory.api';
import { pharmacyAPI }   from '@api/pharmacy.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'visits',        label: 'Active Visits',    icon: ClipboardDocumentListIcon },
  { key: 'lab',           label: 'Lab Orders',        icon: BeakerIcon },
  { key: 'prescriptions', label: 'Prescriptions',     icon: ShoppingBagIcon },
];

export default function ReceptionOrdersPage() {
  const [tab,     setTab]     = useState('visits');
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'visits') {
        res = await opdAPI.getAll({
          page, limit,
          search: debounced || undefined,
          status: status    || undefined,
        });
      } else if (tab === 'lab') {
        res = await laboratoryAPI.getAll({
          page, limit,
          search: debounced || undefined,
          status: status    || undefined,
        });
      } else {
        res = await pharmacyAPI.getAll({
          page, limit,
          search: debounced || undefined,
          status: status    || undefined,
        });
      }
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  }, [tab, page, limit, debounced, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); setStatus(''); setSearch(''); }, [tab]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Orders — Reception View</h1>
          <p className="page-subtitle">Monitor all active visits, lab orders and prescriptions</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search} onChange={setSearch}
            placeholder={
              tab === 'visits'        ? 'Search by patient name, visit no...' :
              tab === 'lab'           ? 'Search by order no, patient name...' :
                                        'Search by Rx no, patient name...'
            }
            className="flex-1"
          />
          <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {tab === 'visits' && <>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_LAB">Pending Lab</option>
              <option value="PENDING_PHARMACY">Pending Pharmacy</option>
              <option value="COMPLETED">Completed</option>
            </>}
            {tab === 'lab' && <>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="APPROVED">Approved</option>
            </>}
            {tab === 'prescriptions' && <>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
              <option value="DISPENSED">Dispensed</option>
            </>}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner text="Loading..." /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">

            {/* ── Active Visits ── */}
            {tab === 'visits' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Visit No</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Clinic</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Lab</th>
                    <th>Rx</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {data.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-10 text-gray-400">No visits found</td></tr>
                  )}
                  {data.map(v => (
                    <tr key={v.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-primary-600">{v.visitNo}</span>
                      </td>
                      <td>
                        <div className="font-medium">{v.patient?.firstName} {v.patient?.lastName}</div>
                        <div className="text-xs text-gray-400">{v.patient?.patientId}</div>
                      </td>
                      <td className="text-sm">
                        {v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : '—'}
                      </td>
                      <td className="text-xs text-gray-500">{v.clinicType?.replace(/_/g,' ')}</td>
                      <td className="text-xs text-gray-500">{new Date(v.visitDate).toLocaleDateString()}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <span className={`text-xs font-semibold ${v.labOrders?.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {v.labOrders?.length ?? 0} order(s)
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold ${v.prescriptions?.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {v.prescriptions?.length ?? 0} Rx
                        </span>
                      </td>
                      <td>
                        <Link to={`/opd/${v.id}`} className="text-xs text-primary-600 hover:underline font-medium">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Lab Orders ── */}
            {tab === 'lab' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Tests</th>
                    <th>Urgency</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {data.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">No lab orders found</td></tr>
                  )}
                  {data.map(o => (
                    <tr key={o.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-blue-600">{o.orderNo}</span>
                      </td>
                      <td>
                        <div className="font-medium">{o.patient?.firstName} {o.patient?.lastName}</div>
                        <div className="text-xs text-gray-400">{o.patient?.patientId}</div>
                      </td>
                      <td className="text-sm">
                        {o.doctor ? `Dr. ${o.doctor.firstName} ${o.doctor.lastName}` : '—'}
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-blue-600">
                          {o.items?.length ?? 0} test(s)
                        </span>
                        <div className="text-xs text-gray-400 max-w-[180px] truncate">
                          {o.items?.map(i => i.test?.testName).join(', ')}
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          o.urgency === 'STAT'   ? 'bg-red-100 text-red-700' :
                          o.urgency === 'URGENT' ? 'bg-orange-100 text-orange-700' :
                                                   'bg-gray-100 text-gray-600'
                        }`}>{o.urgency}</span>
                      </td>
                      <td className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td>
                        <Link to={`/laboratory/${o.id}`} className="text-xs text-primary-600 hover:underline font-medium">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── Prescriptions ── */}
            {tab === 'prescriptions' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Rx No</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Drugs</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Dispensed</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {data.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No prescriptions found</td></tr>
                  )}
                  {data.map(rx => (
                    <tr key={rx.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-green-600">{rx.prescriptionNo}</span>
                      </td>
                      <td>
                        <div className="font-medium">{rx.patient?.firstName} {rx.patient?.lastName}</div>
                        <div className="text-xs text-gray-400">{rx.patient?.patientId}</div>
                      </td>
                      <td className="text-sm">
                        {rx.doctor ? `Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}` : '—'}
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-green-600">
                          {rx.items?.length ?? 0} drug(s)
                        </span>
                        <div className="text-xs text-gray-400 max-w-[180px] truncate">
                          {rx.items?.map(i => i.drug?.genericName).join(', ')}
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</td>
                      <td><StatusBadge status={rx.status} /></td>
                      <td className="text-xs text-gray-500">
                        {rx.dispensedAt ? new Date(rx.dispensedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1}
                  className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">← Prev</button>
                <button onClick={() => goToPage(page + 1)} disabled={page * limit >= total}
                  className="btn-secondary py-1 px-3 text-sm disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
