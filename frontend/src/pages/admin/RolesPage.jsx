import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@components/common/Modal';
import { ShieldCheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { rolesAPI } from '@api/roles.api';
import toast from 'react-hot-toast';

export default function RolesPage() {
  const [roles,       setRoles]       = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [showEdit,    setShowEdit]    = useState(false);
  const [checkedPerms,setCheckedPerms]= useState(new Set());
  const [saving,      setSaving]      = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        rolesAPI.getAll({ limit: 100 }),
        rolesAPI.getAllPermissions(),
      ]);
      setRoles(rRes.data?.data ?? []);
      setPermissions(pRes.data?.data ?? []);
    } catch { toast.error('Failed to load roles'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openEdit = (role) => {
    setSelected(role);
    const ids = new Set((role.permissions ?? []).map(p => p.id));
    setCheckedPerms(ids);
    setShowEdit(true);
  };

  const togglePerm = (id) => {
    setCheckedPerms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rolesAPI.assignPermissions(selected.id, [...checkedPerms]);
      toast.success('Permissions updated');
      setShowEdit(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update');
    } finally { setSaving(false); }
  };

  // group permissions by module
  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-subtitle">Manage role access levels and permission assignments</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const permCount = role.permissions?.length ?? role._count?.permissions ?? 0;
            return (
              <div key={role.id} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{role.displayName}</h3>
                      <p className="text-xs text-gray-400 font-mono">{role.name}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="badge badge-blue text-xs">System</span>
                  )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{permCount}</span> permission{permCount !== 1 ? 's' : ''}
                </div>

                {/* Preview first few permissions */}
                <div className="flex flex-wrap gap-1">
                  {(role.permissions ?? []).slice(0, 5).map(p => (
                    <span key={p.id} className="badge badge-gray text-xs">{p.module}</span>
                  ))}
                  {permCount > 5 && (
                    <span className="badge badge-gray text-xs">+{permCount - 5} more</span>
                  )}
                </div>

                <button onClick={() => openEdit(role)} className="w-full btn-secondary text-sm py-1.5">
                  Manage Permissions
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Permissions Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)}
        title={`Permissions — ${selected?.displayName}`} size="xl"
        footer={
          <>
            <button onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Permissions'}
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="card p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {module.replace(/_/g,' ')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox"
                      className="w-4 h-4 rounded accent-primary-600"
                      checked={checkedPerms.has(p.id)}
                      onChange={() => togglePerm(p.id)} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
                      {p.displayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
