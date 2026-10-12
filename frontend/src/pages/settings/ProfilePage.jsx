import React, { useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { UserCircleIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import api from '@api/axios';
import toast from 'react-hot-toast';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const emp = user?.employee;

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View your account details and change your password</p>
        </div>
      </div>

      {/* Account info */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4 text-primary-600" /> Account Information
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary-600">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {emp ? `${emp.firstName} ${emp.lastName}` : user?.username}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge badge-blue mt-1">{user?.role?.displayName}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <InfoRow label="Username"    value={user?.username} />
          <InfoRow label="Email"       value={user?.email} />
          <InfoRow label="Role"        value={user?.role?.displayName} />
          {emp && <>
            <InfoRow label="Employee No"  value={emp.employeeNo} />
            <InfoRow label="Job Title"    value={emp.jobTitle} />
            <InfoRow label="Department"   value={emp.department?.name} />
            <InfoRow label="Phone"        value={emp.phone} />
          </>}
        </div>
      </div>

      {/* Permissions */}
      {user?.role?.permissions?.length > 0 && (
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-primary-600" /> My Permissions
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.role.permissions.map(p => (
              <span key={p.id} className="badge badge-gray text-xs">{p.displayName}</span>
            ))}
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyIcon className="w-4 h-4 text-primary-600" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="label">Current Password *</label>
            <input type="password" className="input"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">New Password *</label>
            <input type="password" className="input" placeholder="Min. 8 characters"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input type="password" className="input"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
