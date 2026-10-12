import React, { useState, useEffect, useCallback } from 'react';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  BanknotesIcon, CheckCircleIcon, ClockIcon,
  DocumentArrowDownIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import { payrollAPI }    from '@api/payroll.api';
import { employeesAPI }  from '@api/employees.api';
import { usePagination } from '@hooks/usePagination';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white text-base">{value}</p>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [month,     setMonth]     = useState(CURRENT_MONTH);
  const [year,      setYear]      = useState(CURRENT_YEAR);
  const [status,    setStatus]    = useState('');
  const [employees, setEmployees] = useState([]);
  const [showGen,   setShowGen]   = useState(false);
  const [genForm,   setGenForm]   = useState({ employeeId: 'ALL', month: CURRENT_MONTH, year: CURRENT_YEAR });
  const [saving,    setSaving]    = useState(false);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payrollAPI.getAll({
        page, limit, month, year,
        status: status || undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load payroll'); }
    finally  { setLoading(false); }
  }, [page, limit, month, year, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [month, year, status]);

  // ── load employees for generate form ─────────────────────────────
  useEffect(() => {
    employeesAPI.getAll({ limit: 300, status: 'ACTIVE' })
      .then(r => setEmployees(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  // ── generate payroll ──────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await payrollAPI.generate(genForm);
      toast.success('Payroll generated successfully');
      setShowGen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to generate payroll');
    } finally { setSaving(false); }
  };

  // ── approve ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await payrollAPI.approve(id);
      toast.success('Payslip approved');
      fetchData();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  // ── mark paid ─────────────────────────────────────────────────────
  const handlePay = async (id) => {
    const ref = window.prompt('Enter payment reference (bank transfer, cheque no., etc.):');
    if (ref === null) return;
    try {
      await payrollAPI.pay(id, ref);
      toast.success('Marked as paid');
      fetchData();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed'); }
  };

  // ── derived stats ─────────────────────────────────────────────────
  const stats = data.reduce(
    (a, p) => {
      a.gross     += parseFloat(p.grossSalary   || 0);
      a.net       += parseFloat(p.netSalary     || 0);
      a.deductions+= parseFloat(p.totalDeductions|| 0);
      if (p.status === 'PENDING')  a.pending++;
      if (p.status === 'APPROVED') a.approved++;
      if (p.status === 'PAID')     a.paid++;
      return a;
    },
    { gross: 0, net: 0, deductions: 0, pending: 0, approved: 0, paid: 0 }
  );

  const columns = [
    {
      key: 'payrollNo', label: 'Payroll No',
      render: (v) => <span className="font-mono text-xs font-semibold">{v}</span>,
    },
    {
      key: 'employee', label: 'Employee',
      render: (_, r) => r.employee ? (
        <div>
          <div className="font-medium">{r.employee.firstName} {r.employee.lastName}</div>
          <div className="text-xs text-gray-400">{r.employee.jobTitle}</div>
        </div>
      ) : '—',
    },
    {
      key: 'month', label: 'Period',
      render: (_, r) => `${MONTHS[r.month - 1]} ${r.year}`,
    },
    {
      key: 'basicSalary', label: 'Basic',
      render: (v) => fmt(v),
    },
    {
      key: 'allowances', label: 'Allowances',
      render: (v) => <span className="text-green-600">{fmt(v)}</span>,
    },
    {
      key: 'totalDeductions', label: 'Deductions',
      render: (v) => <span className="text-red-500">{fmt(v)}</span>,
    },
    {
      key: 'netSalary', label: 'Net Salary',
      render: (v) => <span className="font-bold text-primary-600">{fmt(v)}</span>,
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          {r.status === 'PENDING' && (
            <button onClick={() => handleApprove(r.id)}
              className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 inline-flex"
              title="Approve">
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          {r.status === 'APPROVED' && (
            <button onClick={() => handlePay(r.id)}
              className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 inline-flex"
              title="Mark as Paid">
              <BanknotesIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Generate, approve and pay employee salaries</p>
        </div>
        <button onClick={() => setShowGen(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Generate Payroll
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={BanknotesIcon}    label="Gross Total"  value={fmt(stats.gross)}      color="text-primary-600 bg-primary-50" />
        <StatCard icon={BanknotesIcon}    label="Net Total"    value={fmt(stats.net)}        color="text-green-600  bg-green-50"   />
        <StatCard icon={BanknotesIcon}    label="Deductions"   value={fmt(stats.deductions)} color="text-red-600    bg-red-50"     />
        <StatCard icon={ClockIcon}        label="Pending"      value={stats.pending}          color="text-yellow-600 bg-yellow-50"  />
        <StatCard icon={CheckCircleIcon}  label="Approved"     value={stats.approved}         color="text-blue-600   bg-blue-50"    />
        <StatCard icon={CheckCircleIcon}  label="Paid"         value={stats.paid}             color="text-green-600  bg-green-50"   />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select className="input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['PENDING','APPROVED','PAID','CANCELLED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No payroll records found"
      />

      {/* Generate Modal */}
      <Modal isOpen={showGen} onClose={() => setShowGen(false)}
        title="Generate Payroll" size="sm"
        footer={
          <>
            <button onClick={() => setShowGen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleGenerate} disabled={saving} className="btn-primary">
              {saving ? 'Generating...' : 'Generate'}
            </button>
          </>
        }
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            This will calculate salaries for the selected period based on basic salary,
            allowances, deductions and attendance records.
          </div>
          <div>
            <label className="label">Employee</label>
            <select className="input" value={genForm.employeeId}
              onChange={e => setGenForm(f => ({ ...f, employeeId: e.target.value }))}>
              <option value="ALL">All Active Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} — {e.employeeNo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month</label>
              <select className="input" value={genForm.month}
                onChange={e => setGenForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={genForm.year}
                onChange={e => setGenForm(f => ({ ...f, year: parseInt(e.target.value) }))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
