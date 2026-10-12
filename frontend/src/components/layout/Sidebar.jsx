import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import {
  HomeIcon, UserGroupIcon, CalendarIcon, ClipboardDocumentListIcon,
  BeakerIcon, ShoppingBagIcon, ArchiveBoxIcon, BanknotesIcon,
  BuildingOfficeIcon, ScissorsIcon, TruckIcon, UserIcon,
  ClockIcon, DocumentChartBarIcon, ShieldCheckIcon, Cog6ToothIcon,
  ChevronDownIcon, ChevronRightIcon, XMarkIcon, ChevronLeftIcon,
  HeartIcon, CreditCardIcon, QueueListIcon, BoltIcon, PrinterIcon,
} from '@heroicons/react/24/outline';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: HomeIcon,
    to: '/dashboard',
    permission: 'dashboard:view',
  },
  {
    label: 'Reception',
    icon: UserGroupIcon,
    permission: 'patients:view',
    children: [
      { label: 'Patients',        to: '/patients',          permission: 'patients:view' },
      { label: 'Register Patient',to: '/patients/register', permission: 'patients:create' },
      { label: 'Appointments',    to: '/appointments',      permission: 'appointments:view' },
      { label: 'Queue',           to: '/queue',             permission: 'appointments:view' },
      { label: 'OPD Orders',      to: '/reception/orders',  permission: 'patients:view' },
    ],
  },
  {
    label: 'Clinical',
    icon: HeartIcon,
    permission: 'triage:view',
    children: [
      { label: 'Triage',    to: '/triage', permission: 'triage:view' },
      { label: 'OPD',       to: '/opd',    permission: 'opd:view' },
    ],
  },
  {
    label: 'Laboratory',
    icon: BeakerIcon,
    permission: 'lab:view',
    children: [
      { label: 'Lab Orders', to: '/laboratory',       permission: 'lab:view' },
    ],
  },
  {
    label: 'Pharmacy',
    icon: ShoppingBagIcon,
    permission: 'pharmacy:view',
    children: [
      { label: 'Prescriptions', to: '/pharmacy',       permission: 'pharmacy:view' },
      { label: 'Drugs Catalog', to: '/pharmacy/drugs', permission: 'pharmacy:manage_drugs' },
    ],
  },
  {
    label: 'Inventory',
    icon: ArchiveBoxIcon,
    to: '/inventory',
    permission: 'inventory:view',
  },
  {
    label: 'Billing',
    icon: BanknotesIcon,
    permission: 'billing:view',
    children: [
      { label: 'Bills',    to: '/billing',  permission: 'billing:view' },
    ],
  },
  {
    label: 'Inpatient',
    icon: BuildingOfficeIcon,
    permission: 'admissions:view',
    children: [
      { label: 'Admissions',   to: '/admissions',    permission: 'admissions:view' },
      { label: 'Wards',        to: '/wards',          permission: 'wards:manage' },
      { label: 'Beds',         to: '/beds',           permission: 'beds:manage' },
    ],
  },
  {
    label: 'Operation Room',
    icon: ScissorsIcon,
    to: '/operation-room',
    permission: 'or:view',
  },
  {
    label: 'Delivery',
    icon: TruckIcon,
    to: '/delivery',
    permission: 'delivery:view',
  },
  {
    label: 'HR & Payroll',
    icon: UserIcon,
    permission: 'employees:view',
    children: [
      { label: 'Employees',  to: '/employees',  permission: 'employees:view' },
      { label: 'Attendance', to: '/attendance', permission: 'attendance:view' },
      { label: 'Leave',      to: '/leave',      permission: 'leave:apply' },
      { label: 'Payroll',    to: '/payroll',    permission: 'payroll:view' },
    ],
  },
  {
    label: 'Reports',
    icon: DocumentChartBarIcon,
    to: '/reports',
    permission: 'reports:view',
  },
  {
    label: 'Print Templates',
    icon: PrinterIcon,
    to: '/print-templates',
  },
  {
    label: 'Administration',
    icon: ShieldCheckIcon,
    permission: 'users:view',
    children: [
      { label: 'Users',       to: '/admin/users',      permission: 'users:view' },
      { label: 'Roles',       to: '/admin/roles',      permission: 'roles:view' },
      { label: 'Audit Logs',  to: '/admin/audit-logs', permission: 'audit:view' },
      { label: 'Backup',      to: '/admin/backup',     permission: 'backup:manage' },
    ],
  },
];

function NavItem({ item, collapsed }) {
  const { hasPermission } = useAuthStore();
  const location = useLocation();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => location.pathname.startsWith(c.to))
  );

  // Permission check
  if (item.permission && !hasPermission(item.permission)) return null;

  const Icon = item.icon;

  // Simple link
  if (item.to && !item.children) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
           ${isActive
             ? 'bg-primary-600 text-white shadow-sm'
             : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
           }`
        }
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  // Group with children
  const isGroupActive = item.children?.some((c) => location.pathname.startsWith(c.to));

  return (
    <div>
      <button
        onClick={() => !collapsed && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isGroupActive
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {open
              ? <ChevronDownIcon  className="w-4 h-4 flex-shrink-0" />
              : <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
            }
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          {item.children.map((child) => {
            if (child.permission && !hasPermission(child.permission)) return null;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm transition-all
                   ${isActive
                     ? 'bg-primary-600 text-white'
                     : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                   }`
                }
              >
                {child.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, collapsed, onClose, onToggleCollapse }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 bg-white dark:bg-gray-800
                    border-r border-gray-200 dark:border-gray-700 shadow-sm
                    transition-all duration-300 hidden lg:flex flex-col
                    ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-64 bg-white dark:bg-gray-800
                    border-r border-gray-200 dark:border-gray-700 shadow-lg
                    transition-transform duration-300 flex flex-col lg:hidden
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent collapsed={false} onClose={onClose} />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed, onToggleCollapse, onClose }) {
  return (
    <>
      {/* Logo */}
      <div className={`flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">YFM</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">YFM General Hospital</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">PLC — HMS v1.0</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">YFM</span>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:block"
          >
            <ChevronLeftIcon className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <NavItem key={i} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 px-2 py-3 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
             ${isActive ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`
          }
          title={collapsed ? 'Profile' : undefined}
        >
          <UserIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Profile</span>}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
             ${isActive ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`
          }
          title={collapsed ? 'Settings' : undefined}
        >
          <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </>
  );
}

export default Sidebar;
