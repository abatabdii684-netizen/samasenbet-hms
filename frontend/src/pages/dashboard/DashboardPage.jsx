import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '@api/dashboard.api';
import { useAuthStore } from '@store/authStore';
import {
  UserGroupIcon, CalendarIcon, BeakerIcon, ShoppingBagIcon,
  BuildingOfficeIcon, BanknotesIcon, HeartIcon, ClockIcon,
  ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon,
  PlusIcon, UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend
);

const THIS_YEAR = new Date().getFullYear();
const fmt = (n) => Number(n || 0).toLocaleString();
const fmtETB = (n) => `ETB ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, loading, sub }) {
  const colors = {
    blue:   { bg: 'bg-gradient-to-br from-blue-500 to-blue-600',     icon: 'text-white', card: 'border-blue-100   dark:border-blue-900/30' },
    green:  { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', icon: 'text-white', card: 'border-green-100  dark:border-green-900/30' },
    purple: { bg: 'bg-gradient-to-br from-purple-500 to-indigo-600', icon: 'text-white', card: 'border-purple-100 dark:border-purple-900/30' },
    red:    { bg: 'bg-gradient-to-br from-rose-500 to-red-600',      icon: 'text-white', card: 'border-red-100    dark:border-red-900/30'    },
    yellow: { bg: 'bg-gradient-to-br from-amber-400 to-orange-500',  icon: 'text-white', card: 'border-yellow-100 dark:border-yellow-900/30' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`card p-5 flex items-center gap-4 border ${c.card}`}>
      <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${c.bg}`}>
        <Icon className={`w-6 h-6 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{title}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Alert item ────────────────────────────────────────────────────
function AlertItem({ type, message, module }) {
  const cfg = {
    WARNING: { Icon: ExclamationTriangleIcon, cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    ERROR:   { Icon: ExclamationTriangleIcon, cls: 'text-red-600    bg-red-50    dark:bg-red-900/20'    },
    INFO:    { Icon: ClockIcon,               cls: 'text-blue-600   bg-blue-50   dark:bg-blue-900/20'   },
    SUCCESS: { Icon: CheckCircleIcon,         cls: 'text-green-600  bg-green-50  dark:bg-green-900/20'  },
  };
  const { Icon, cls } = cfg[type] || cfg.INFO;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
        {module && <p className="text-xs text-gray-400 mt-0.5 capitalize">{module}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }   = useAuthStore();
  const [overview, setOverview]  = useState(null);
  const [patients, setPatients]  = useState([]);
  const [revenue,  setRevenue]   = useState([]);
  const [alerts,   setAlerts]    = useState([]);
  const [activity, setActivity]  = useState(null);
  const [loading,  setLoading]   = useState(true);
  const [error,    setError]     = useState(false);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.employee?.firstName || user?.username || 'User';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [ovRes, ptRes, rvRes, alRes, acRes] = await Promise.allSettled([
        dashboardAPI.getOverview(),
        dashboardAPI.getPatientChart(),
        dashboardAPI.getRevenueChart(),
        dashboardAPI.getAlerts(),
        dashboardAPI.getRecentActivity(),
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data?.data);
      if (ptRes.status === 'fulfilled') setPatients(ptRes.value.data?.data ?? []);
      if (rvRes.status === 'fulfilled') setRevenue(rvRes.value.data?.data   ?? []);
      if (alRes.status === 'fulfilled') setAlerts(alRes.value.data?.data    ?? []);
      if (acRes.status === 'fulfilled') setActivity(acRes.value.data?.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Chart configs ────────────────────────────────────────────────
  const patientChartData = {
    labels: patients.map(p => p.month),
    datasets: [{
      label: 'OPD Visits',
      data:  patients.map(p => p.count),
      backgroundColor: 'rgba(37,99,235,0.12)',
      borderColor:     'rgba(37,99,235,1)',
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3,
    }],
  };

  const revenueChartData = {
    labels: revenue.map(r => r.month),
    datasets: [{
      label: 'Revenue (ETB)',
      data:  revenue.map(r => r.revenue),
      backgroundColor: 'rgba(21,128,61,0.8)',
      borderRadius: 6,
    }],
  };

  const bedChartData = {
    labels: ['Occupied', 'Available', 'Maintenance'],
    datasets: [{
      data: [
        overview ? overview.totalBeds - overview.availableBeds : 0,
        overview?.availableBeds ?? 0,
        0,
      ],
      backgroundColor: ['#2563eb', '#15803d', '#ca8a04'],
      borderWidth: 0,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {firstName} 👋</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} disabled={loading}
            className="btn-secondary" title="Refresh dashboard">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/patients/register" className="btn-primary">
            <UserPlusIcon className="w-4 h-4" /> Register Patient
          </Link>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          Failed to load some dashboard data. Make sure the backend is running.
          <button onClick={fetchAll} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* ── Stat cards row 1 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"    loading={loading}
          value={fmt(overview?.totalPatients)}
          icon={UserGroupIcon}      color="blue"
          sub="Active patients"
        />
        <StatCard
          title="Today's Visits"   loading={loading}
          value={fmt(overview?.todayVisits)}
          icon={CalendarIcon}       color="green"
          sub="OPD visits today"
        />
        <StatCard
          title="Active Admissions" loading={loading}
          value={fmt(overview?.activeAdmissions)}
          icon={BuildingOfficeIcon} color="purple"
          sub="Inpatients now"
        />
        <StatCard
          title="Bed Occupancy"    loading={loading}
          value={`${overview?.bedOccupancy ?? 0}%`}
          icon={HeartIcon}          color="red"
          sub={`${fmt(overview?.availableBeds)} beds available`}
        />
      </div>

      {/* ── Stat cards row 2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Lab Orders"  loading={loading}
          value={fmt(overview?.pendingLabOrders)}
          icon={BeakerIcon}            color="yellow"
        />
        <StatCard
          title="Pending Prescriptions" loading={loading}
          value={fmt(overview?.pendingPrescriptions)}
          icon={ShoppingBagIcon}       color="blue"
        />
        <StatCard
          title="Today's Revenue"    loading={loading}
          value={fmtETB(overview?.todayRevenue)}
          icon={BanknotesIcon}        color="green"
        />
        <StatCard
          title="Monthly Revenue"    loading={loading}
          value={fmtETB(overview?.monthRevenue)}
          icon={BanknotesIcon}        color="purple"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPD line chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              OPD Visits — Last 12 Months
            </h3>
            <span className="badge badge-blue">Monthly</span>
          </div>
          <div className="h-56">
            {loading ? (
              <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : patients.length > 0 ? (
              <Line data={patientChartData} options={chartOpts} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No visit data yet
              </div>
            )}
          </div>
        </div>

        {/* Bed occupancy donut */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Bed Occupancy</h3>
          <div className="h-48 flex items-center justify-center">
            {loading ? (
              <div className="w-36 h-36 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
            ) : (
              <Doughnut
                data={bedChartData}
                options={{
                  ...chartOpts,
                  cutout: '70%',
                  plugins: { legend: { display: true, position: 'bottom' } },
                }}
              />
            )}
          </div>
          {!loading && overview && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {overview.totalBeds - overview.availableBeds} / {overview.totalBeds} beds occupied
            </p>
          )}
        </div>
      </div>

      {/* ── Revenue bar chart ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Monthly Revenue — {THIS_YEAR}
          </h3>
          <Link to="/reports" className="text-sm text-primary-600 hover:underline">View Report →</Link>
        </div>
        <div className="h-56">
          {loading ? (
            <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
          ) : revenue.length > 0 ? (
            <Bar data={revenueChartData} options={chartOpts} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Register Patient', to: '/patients/register', color: 'bg-blue-50   text-blue-700   hover:bg-blue-100   dark:bg-blue-900/20   dark:text-blue-300' },
              { label: 'New Appointment',  to: '/appointments',      color: 'bg-green-50  text-green-700  hover:bg-green-100  dark:bg-green-900/20  dark:text-green-300' },
              { label: 'Triage Queue',     to: '/queue',             color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300' },
              { label: 'Create Bill',      to: '/billing',           color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300' },
              { label: 'Lab Orders',       to: '/laboratory',        color: 'bg-red-50    text-red-700    hover:bg-red-100    dark:bg-red-900/20    dark:text-red-300' },
              { label: 'Admit Patient',    to: '/admissions',        color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className={`${a.color} rounded-xl p-3 text-sm font-medium text-center transition-colors`}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            System Alerts
            {alerts.length > 0 && (
              <span className="ml-2 badge badge-red text-xs">{alerts.length}</span>
            )}
          </h3>
          <div className="space-y-2">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))
            ) : alerts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">All systems normal</p>
              </div>
            ) : (
              alerts.map((a, i) => <AlertItem key={i} {...a} />)
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Visits</h3>
          <div className="space-y-2">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))
            ) : (activity?.recentVisits?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No recent visits</p>
            ) : (
              activity.recentVisits.map(v => (
                <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {v.patient?.firstName} {v.patient?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{v.patient?.patientId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(v.visitDate).toLocaleDateString()}
                    </p>
                    <span className="text-xs text-primary-600">{v.visitNo}</span>
                  </div>
                </div>
              ))
            )}
            {(activity?.recentVisits?.length ?? 0) > 0 && (
              <Link to="/opd" className="block text-center text-xs text-primary-600 hover:underline pt-1">
                View all visits →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
