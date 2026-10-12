import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@components/common/Badge';
import LoadingSpinner  from '@components/common/LoadingSpinner';
import {
  ArrowLeftIcon, UserIcon, BriefcaseIcon,
  PhoneIcon, BanknotesIcon, CalendarIcon,
  BeakerIcon, ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { employeesAPI } from '@api/employees.api';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Attendance', 'Leave', 'Payslips'];

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 py-1.5
                    border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[160px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 space-y-1">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary-600" /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [emp,        setEmp]        = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [payslips,   setPayslips]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('Overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await employeesAPI.getById(id);
        setEmp(res.data?.data);
      } catch {
        toast.error('Failed to load employee');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Lazy load tab data
  useEffect(() => {
    if (!emp) return;
    if (tab === 'Attendance' && attendance.length === 0) {
      employeesAPI.getAttendance(id, { page: 1, limit: 30 })
        .then(r => setAttendance(r.data?.data ?? []))
        .catch(() => {});
    }
    if (tab === 'Leave' && leaves.length === 0) {
      employeesAPI.getLeaves(id)
        .then(r => setLeaves(r.data?.data ?? []))
        .catch(() => {});
    }
    if (tab === 'Payslips' && payslips.length === 0) {
      employeesAPI.getPayslips(id)
        .then(r => setPayslips(r.data?.data ?? []))
        .catch(() => {});
    }
  }, [tab, emp]);

  if (loading) return <LoadingSpinner text="Loading employee..." />;
  if (!emp)    return null;

  const age = emp.dateOfBirth
    ? Math.floor((Date.now() - new Date(emp.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="page-title">{emp.firstName} {emp.lastName}</h1>
            <p className="page-subtitle">
              {emp.employeeNo} · {emp.jobTitle} · {emp.department?.name}
            </p>
          </div>
        </div>
        <StatusBadge status={emp.status} />
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Employment Type', value: emp.employmentType?.replace(/_/g,' '),   color: 'text-blue-600   bg-blue-50'   },
          { label: 'Attendance',      value: `${emp._count?.attendances ?? 0} records`, color: 'text-green-600  bg-green-50'  },
          { label: 'Leave Requests',  value: emp._count?.leaveRequests ?? 0,           color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Payslips',        value: emp._count?.payrolls ?? 0,                color: 'text-purple-600 bg-purple-50' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
              <BriefcaseIcon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard icon={UserIcon} title="Personal Information">
            <InfoRow label="Full Name"       value={`${emp.firstName} ${emp.lastName}`} />
            <InfoRow label="Gender"          value={emp.gender} />
            <InfoRow label="Date of Birth"   value={emp.dateOfBirth ? `${new Date(emp.dateOfBirth).toLocaleDateString()} (${age} yrs)` : null} />
            <InfoRow label="National ID"     value={emp.nationalId} />
            <InfoRow label="Qualifications"  value={emp.qualifications} />
          </SectionCard>

          <SectionCard icon={PhoneIcon} title="Contact Information">
            <InfoRow label="Phone"           value={emp.phone} />
            <InfoRow label="Email"           value={emp.email} />
            <InfoRow label="Address"         value={emp.address} />
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 mb-2">Emergency Contact</p>
              <InfoRow label="Name"  value={emp.emergencyContact} />
              <InfoRow label="Phone" value={emp.emergencyPhone} />
            </div>
          </SectionCard>

          <SectionCard icon={BriefcaseIcon} title="Employment Details">
            <InfoRow label="Employee No"      value={emp.employeeNo} />
            <InfoRow label="Department"       value={emp.department?.name} />
            <InfoRow label="Job Title"        value={emp.jobTitle} />
            <InfoRow label="Specialization"   value={emp.specialization} />
            <InfoRow label="Employment Type"  value={emp.employmentType?.replace(/_/g,' ')} />
            <InfoRow label="Hire Date"        value={emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : null} />
            <InfoRow label="License Number"   value={emp.licenseNumber} />
          </SectionCard>

          <SectionCard icon={BanknotesIcon} title="Salary & Bank">
            <InfoRow label="Basic Salary"    value={`ETB ${parseFloat(emp.basicSalary || 0).toLocaleString()}`} />
            <InfoRow label="Bank Name"       value={emp.bankName} />
            <InfoRow label="Bank Account"    value={emp.bankAccount} />
            {emp.user && (
              <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 mb-2">System Account</p>
                <InfoRow label="Username"    value={emp.user.username} />
                <InfoRow label="Email"       value={emp.user.email} />
                <InfoRow label="Role"        value={emp.user.role?.displayName} />
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === 'Attendance' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Overtime</th><th>Status</th></tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {attendance.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No attendance records</td></tr>
                ) : attendance.map(a => (
                  <tr key={a.id}>
                    <td className="font-medium">{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.checkIn  ? new Date(a.checkIn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                    <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                    <td>{a.workHours ? `${a.workHours}h` : '—'}</td>
                    <td>{parseFloat(a.overtime) > 0 ? `${a.overtime}h` : '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Leave ── */}
      {tab === 'Leave' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {leaves.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No leave requests</td></tr>
                ) : leaves.map(l => (
                  <tr key={l.id}>
                    <td><span className="badge badge-blue">{l.leaveType?.name}</span></td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td className="font-semibold">{l.totalDays}</td>
                    <td className="max-w-xs truncate text-sm text-gray-500">{l.reason || '—'}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payslips ── */}
      {tab === 'Payslips' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {payslips.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No payslips generated</td></tr>
                ) : payslips.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{MONTHS[p.month - 1]} {p.year}</td>
                    <td>ETB {parseFloat(p.basicSalary    || 0).toLocaleString()}</td>
                    <td className="text-green-600">ETB {parseFloat(p.totalAllowance  || 0).toLocaleString()}</td>
                    <td className="text-red-500">  ETB {parseFloat(p.totalDeduction  || 0).toLocaleString()}</td>
                    <td className="font-bold text-primary-600">ETB {parseFloat(p.netSalary || 0).toLocaleString()}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
