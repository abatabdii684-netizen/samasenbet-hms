import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon, UserGroupIcon,
  BeakerIcon, CalendarDaysIcon, ClipboardDocumentListIcon, HomeModernIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { reportsAPI } from '@api/reports.api';
import StatCard from '@components/common/StatCard';

const TABS = [
  { key: 'daily',      label: 'Daily'      },
  { key: 'monthly',    label: 'Monthly'    },
  { key: 'revenue',    label: 'Revenue'    },
  { key: 'patients',   label: 'Patients'   },
  { key: 'laboratory', label: 'Laboratory' },
];

const toISODate = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const money = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SimpleTable({ columns, rows, empty = 'No records found' }) {
  return (
    <div className="card p-0 table-container">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center text-gray-500 py-6">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={r.id ?? i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const [tab,       setTab]       = useState('daily');
  const [date,      setDate]      = useState(toISODate(today));
  const [month,     setMonth]     = useState(today.getMonth() + 1);
  const [year,      setYear]      = useState(today.getFullYear());
  const [startDate, setStartDate] = useState(toISODate(firstOfMonth));
  const [endDate,   setEndDate]   = useState(toISODate(today));
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(false);

  const params = useCallback(() => {
    if (tab === 'daily')   return { date };
    if (tab === 'monthly') return { month, year };
    return { startDate, endDate };
  }, [tab, date, month, year, startDate, endDate]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setReport(null);
    try {
      let res;
      if (tab === 'daily')           res = await reportsAPI.getDaily(date);
      else if (tab === 'monthly')    res = await reportsAPI.getMonthly(month, year);
      else if (tab === 'revenue')    res = await reportsAPI.getRevenue(startDate, endDate);
      else if (tab === 'patients')   res = await reportsAPI.getPatients(startDate, endDate);
      else                           res = await reportsAPI.getLaboratory(startDate, endDate);
      setReport(res.data?.data ?? res.data ?? null);
    } catch {
      toast.error('Failed to load report');
    } finally { setLoading(false); }
  }, [tab, date, month, year, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportReport = async (format) => {
    try {
      const fn = format === 'pdf' ? reportsAPI.exportPDF : reportsAPI.exportExcel;
      const res = await fn(tab, params());
      downloadBlob(res.data, `${tab}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Hospital activity, revenue and clinical summaries</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={fetchReport} disabled={loading}>
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" className="btn btn-outline" onClick={() => exportReport('excel')}>
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => exportReport('pdf')}>
            <ArrowDownTrayIcon className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        {tab === 'daily' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Date</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}
        {tab === 'monthly' && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Month</span>
              <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Year</span>
              <input type="number" className="input w-28" value={year} min={2000} max={2100}
                onChange={(e) => setYear(Number(e.target.value))} />
            </label>
          </>
        )}
        {!['daily', 'monthly'].includes(tab) && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600 dark:text-gray-400">From</span>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600 dark:text-gray-400">To</span>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </>
        )}
      </div>

      <ReportBody tab={tab} report={report} loading={loading} />
    </div>
  );
}

function ReportBody({ tab, report, loading }) {
  const r = report || {};

  if (tab === 'daily') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="OPD Visits"    value={r.visits ?? 0}        icon={ClipboardDocumentListIcon} color="blue"   loading={loading} />
        <StatCard title="Admissions"    value={r.admissions ?? 0}    icon={HomeModernIcon}            color="purple" loading={loading} />
        <StatCard title="Discharges"    value={r.discharges ?? 0}    icon={HomeModernIcon}            color="yellow" loading={loading} />
        <StatCard title="Revenue"       value={money(r.revenue)}     icon={BanknotesIcon}             color="green"  loading={loading} />
        <StatCard title="Lab Orders"    value={r.labOrders ?? 0}     icon={BeakerIcon}                color="red"    loading={loading} />
        <StatCard title="Prescriptions" value={r.prescriptions ?? 0} icon={ClipboardDocumentListIcon} color="blue"   loading={loading} />
      </div>
    );
  }

  if (tab === 'monthly') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Visits"     value={r.totalVisits ?? 0}     icon={CalendarDaysIcon} color="blue"   loading={loading} />
          <StatCard title="Total Admissions" value={r.totalAdmissions ?? 0} icon={HomeModernIcon}   color="purple" loading={loading} />
          <StatCard title="Total Revenue"    value={money(r.totalRevenue)}  icon={BanknotesIcon}    color="green"  loading={loading} />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Diagnoses</h2>
        <SimpleTable
          columns={[
            { key: 'diagnosis', label: 'Diagnosis', render: (d) => d.diagnosis ?? d.name ?? '-' },
            { key: 'count',     label: 'Count',     render: (d) => d.count ?? d._count?.diagnosis ?? '-' },
          ]}
          rows={Array.isArray(r.topDiagnoses) ? r.topDiagnoses : []}
        />
      </div>
    );
  }

  if (tab === 'revenue') {
    const transactions = Array.isArray(r.transactions) ? r.transactions : [];
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Revenue" value={money(r.total)} icon={BanknotesIcon} color="green" loading={loading} />
          {(r.byMethod || []).map((m) => (
            <StatCard key={m.method} title={m.method} value={money(m.amount)} icon={BanknotesIcon} color="blue" loading={loading} />
          ))}
        </div>
        <SimpleTable
          columns={[
            { key: 'paidAt',  label: 'Date',    render: (t) => t.paidAt ? new Date(t.paidAt).toLocaleString() : '-' },
            { key: 'patient', label: 'Patient', render: (t) => t.bill?.patient ? `${t.bill.patient.firstName} ${t.bill.patient.lastName}` : '-' },
            { key: 'method',  label: 'Method' },
            { key: 'amount',  label: 'Amount',  render: (t) => money(t.amount) },
          ]}
          rows={transactions}
          empty={loading ? 'Loading…' : 'No transactions in this period'}
        />
      </div>
    );
  }

  if (tab === 'patients') {
    const patients = Array.isArray(r.newPatients) ? r.newPatients : [];
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="New Patients" value={patients.length} icon={UserGroupIcon} color="blue" loading={loading} />
          {(r.byGender || []).map((g) => (
            <StatCard key={g.gender} title={g.gender} value={g._count?.gender ?? 0} icon={UserGroupIcon} color="purple" loading={loading} />
          ))}
        </div>
        {r.ageGroups && (
          <div className="card p-4 flex flex-wrap gap-6">
            {Object.entries(r.ageGroups).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-500">Age {k}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{v}</p>
              </div>
            ))}
          </div>
        )}
        <SimpleTable
          columns={[
            { key: 'patientId', label: 'Patient ID' },
            { key: 'name',      label: 'Name',       render: (p) => `${p.firstName} ${p.lastName}` },
            { key: 'gender',    label: 'Gender' },
            { key: 'phone',     label: 'Phone' },
            { key: 'createdAt', label: 'Registered', render: (p) => new Date(p.createdAt).toLocaleDateString() },
          ]}
          rows={patients}
          empty={loading ? 'Loading…' : 'No new patients in this period'}
        />
      </div>
    );
  }

  const orders = Array.isArray(r.orders) ? r.orders : [];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Orders" value={r.totalOrders ?? 0} icon={BeakerIcon} color="blue" loading={loading} />
        {(r.byStatus || []).map((s) => (
          <StatCard key={s.status} title={s.status} value={s._count?.status ?? 0} icon={BeakerIcon} color="yellow" loading={loading} />
        ))}
      </div>
      <SimpleTable
        columns={[
          { key: 'createdAt', label: 'Date',    render: (o) => new Date(o.createdAt).toLocaleString() },
          { key: 'patient',   label: 'Patient', render: (o) => o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : '-' },
          { key: 'tests',     label: 'Tests',   render: (o) => (o.items || []).map((i) => i.test?.name).filter(Boolean).join(', ') || '-' },
          { key: 'status',    label: 'Status' },
        ]}
        rows={orders}
        empty={loading ? 'Loading…' : 'No lab orders in this period'}
      />
    </div>
  );
}
