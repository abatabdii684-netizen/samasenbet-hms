import React, { useState, useEffect, useCallback } from 'react';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  PlusIcon, KeyIcon, UserCircleIcon,
  ShieldCheckIcon, CheckCircleIcon, XCircleIcon,
  MagnifyingGlassIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { usersAPI }      from '@api/users.api';
import { rolesAPI }      from '@api/roles.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const EMPTY = {
  username: '', email: '', password: '', confirmPassword: '',
  roleId: '', isActive: true,
};

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

export default function UsersPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [roles,     setRoles]     = useState([]);
  const [search,    setSearch]    = useState('');
  const [roleFilter,setRoleFilter]= useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [newPwd,    setNewPwd]    = useState('');
  const [saving,    setSaving]    = useState(false);

  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({
        page, limit,
        search:   debounced    || undefined,
        roleId:   roleFilter   || undefined,
        isActive: statusFilter === 'active' ? 'true'
                : statusFilter === 'inactive' ? 'false'
                : undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  }, [page, limit, debounced, roleFilter, statusFilter]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await rolesAPI.getAll({ limit: 100 });
      setRoles(res.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData();  }, [fetchData]);
  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => { resetPage();  }, [debounced, roleFilter, statusFilter]);

  // ── stats ─────────────────────────────────────────────────────────
  const activeCount   = data.filter(u => u.isActive).length;
  const inactiveCount = data.filter(u => !u.isActive).length;

  // ── open add ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditUser(null);
    setForm(EMPTY);
    setShowAdd(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      username: u.username,
      email:    u.email,
      password: '',
      confirmPassword: '',
      roleId:   String(u.roleId ?? u.role?.id ?? ''),
      isActive: u.isActive,
    });
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditUser(null);
    setForm(EMPTY);
  };

  // ── save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) { toast.error('Username is required'); return; }
    if (!form.email.trim())    { toast.error('Email is required');    return; }
    if (!form.roleId)          { toast.error('Role is required');     return; }

    if (!editUser) {
      if (!form.password)                          { toast.error('Password is required'); return; }
      if (form.password.length < 8)                { toast.error('Password must be at least 8 characters'); return; }
      if (form.password !== form.confirmPassword)  { toast.error('Passwords do not match'); return; }
    } else {
      if (form.password && form.password.length < 8)               { toast.error('Password must be at least 8 characters'); return; }
      if (form.password && form.password !== form.confirmPassword)  { toast.error('Passwords do not match'); return; }
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username,
        email:    form.email,
        roleId:   form.roleId,
        isActive: form.isActive,
      };
      if (!editUser || form.password) payload.password = form.password;

      if (editUser) {
        if (!payload.password) delete payload.password;
        await usersAPI.update(editUser.id, payload);
        toast.success('User updated successfully');
      } else {
        await usersAPI.create(payload);
        toast.success('User created successfully');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save user');
    } finally { setSaving(false); }
  };

  // ── toggle status ─────────────────────────────────────────────────
  const handleToggle = async (u) => {
    const action = u.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user "${u.username}"?`)) return;
    try {
      await usersAPI.toggleStatus(u.id);
      toast.success(`User ${action}d`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  // ── reset password ────────────────────────────────────────────────
  const openReset = (u) => {
    setResetUser(u);
    setNewPwd('');
    setShowReset(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPwd || newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await usersAPI.update(resetUser.id, { password: newPwd });
      toast.success(`Password reset for ${resetUser.username}`);
      setShowReset(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to reset password');
    } finally { setSaving(false); }
  };

  // ── delete ────────────────────────────────────────────────────────
  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await usersAPI.remove(u.id);
      toast.success('User deleted');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete user');
    }
  };

  // ── columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'username', label: 'User',
      render: (v, r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-600">
              {v?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{v}</div>
            {r.employee && (
              <div className="text-xs text-gray-400">
                {r.employee.firstName} {r.employee.lastName} · {r.employee.jobTitle}
              </div>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (_, r) => r.role ? (
        <span className="badge badge-blue text-xs">{r.role.displayName}</span>
      ) : '—',
    },
    {
      key: 'lastLoginAt', label: 'Last Login',
      render: (v) => v
        ? new Date(v).toLocaleDateString()
        : <span className="text-gray-400 text-xs italic">Never</span>,
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => openEdit(r)}
            className="text-xs text-primary-600 hover:underline font-medium px-1">
            Edit
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={() => openReset(r)}
            className="text-xs text-yellow-600 hover:underline font-medium px-1"
            title="Reset Password">
            Reset Pwd
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={() => handleToggle(r)}
            className={`text-xs hover:underline font-medium px-1 ${
              r.isActive ? 'text-red-500' : 'text-green-500'
            }`}>
            {r.isActive ? 'Suspend' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {total} user{total !== 1 ? 's' : ''} · {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading} className="btn-secondary" title="Refresh">
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAdd} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={UserCircleIcon}  label="Total Users"   value={total}         color="text-primary-600 bg-primary-50" />
        <StatCard icon={CheckCircleIcon} label="Active"        value={activeCount}   color="text-green-600  bg-green-50"   />
        <StatCard icon={XCircleIcon}     label="Inactive"      value={inactiveCount} color="text-red-600    bg-red-50"     />
        <StatCard icon={ShieldCheckIcon} label="Total Roles"   value={roles.length}  color="text-purple-600 bg-purple-50" />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input pl-9"
              placeholder="Search username or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.displayName}</option>
            ))}
          </select>
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No users found"
      />

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={showAdd}
        onClose={closeModal}
        title={editUser ? `Edit User — ${editUser.username}` : 'Add New User'}
        size="md"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Username *</label>
              <input type="text" className="input"
                placeholder="e.g. john.doe"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input"
                placeholder="e.g. john@yfmhospital.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required />
            </div>
          </div>

          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))} required>
              <option value="">Select role...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.displayName}</option>
              ))}
            </select>
            {form.roleId && (
              <p className="text-xs text-gray-400 mt-1">
                {roles.find(r => String(r.id) === String(form.roleId))?.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                {editUser ? 'New Password' : 'Password *'}
              </label>
              <input type="password" className="input"
                placeholder={editUser ? 'Leave blank to keep' : 'Min. 8 characters'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editUser} />
            </div>
            <div>
              <label className="label">Confirm Password {!editUser && '*'}</label>
              <input type="password" className="input"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required={!editUser} />
            </div>
          </div>

          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-xs text-red-500 -mt-2">Passwords do not match</p>
          )}
          {form.password && form.password.length > 0 && form.password.length < 8 && (
            <p className="text-xs text-orange-500 -mt-2">Password must be at least 8 characters</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="isActive"
              className="w-4 h-4 accent-primary-600"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="isActive"
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Active account (user can log in)
            </label>
          </div>
        </form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        title={`Reset Password — ${resetUser?.username}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowReset(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReset} disabled={saving} className="btn-warning">
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        }
      >
        <form onSubmit={handleReset} className="space-y-4">
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-700 dark:text-yellow-300">
            This will immediately change the password for <strong>{resetUser?.username}</strong>.
            The user will need the new password to log in.
          </div>
          <div>
            <label className="label">New Password *</label>
            <input type="password" className="input"
              placeholder="Min. 8 characters"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required />
          </div>
          {newPwd && newPwd.length > 0 && newPwd.length < 8 && (
            <p className="text-xs text-red-500">Password must be at least 8 characters</p>
          )}
        </form>
      </Modal>

    </div>
  );
}
