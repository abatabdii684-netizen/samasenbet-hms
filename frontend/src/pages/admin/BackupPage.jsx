import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownTrayIcon, TrashIcon, ArrowPathIcon,
  CircleStackIcon, PlusIcon, ShieldCheckIcon,
  ClockIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '@api/axios';
import toast from 'react-hot-toast';

const fmtSize = (kb) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function BackupPage() {
  const [backups,  setBackups]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [label,    setLabel]    = useState('');

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/backup');
      setBackups(res.data?.data ?? []);
    } catch { toast.error('Failed to load backups'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/backup/create', { label: label.trim() });
      toast.success('Backup created successfully');
      setLabel('');
      fetchBackups();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Backup failed — ensure mysqldump is installed');
    } finally { setCreating(false); }
  };

  const handleDownload = (id) => {
    const token = localStorage.getItem('accessToken');
    const url   = `${import.meta.env.VITE_API_BASE_URL}/backup/download/${encodeURIComponent(id)}`;
    const a     = document.createElement('a');
    a.href      = url;
    a.setAttribute('download', id);
    // include auth via query (simple approach) — backend reads token from header normally
    window.open(url, '_blank');
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete backup "${id}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/backup/${encodeURIComponent(id)}`);
      toast.success('Backup deleted');
      fetchBackups();
    } catch { toast.error('Failed to delete backup'); }
  };

  const latest   = backups[0];
  const totalSize = backups.reduce((s, b) => s + (b.sizeKB ?? 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backup & Restore</h1>
          <p className="page-subtitle">Create and manage database backup files</p>
        </div>
        <button onClick={fetchBackups} disabled={loading} className="btn-secondary">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={CircleStackIcon} label="Total Backups" value={backups.length}     color="text-primary-600 bg-primary-50" />
        <StatCard icon={ClockIcon}       label="Last Backup"
          value={latest ? new Date(latest.createdAt).toLocaleDateString() : 'Never'}
          color="text-blue-600 bg-blue-50" />
        <StatCard icon={CheckCircleIcon} label="Total Size"    value={fmtSize(totalSize)} color="text-green-600  bg-green-50"   />
      </div>

      {/* Create backup */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <PlusIcon className="w-4 h-4 text-primary-600" /> Create New Backup
        </h3>
        <div className="flex gap-3">
          <input type="text" className="input flex-1" placeholder="Optional label (e.g. pre-update)"
            value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={creating} className="btn-primary whitespace-nowrap">
            {creating ? (
              <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><CircleStackIcon className="w-4 h-4" /> Create Backup</>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Requires <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">mysqldump</code> to be installed and accessible in PATH.
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <p className="font-semibold mb-1">Restore Instructions</p>
            <p>To restore a backup, download the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.sql</code> file
            and run it against your database using:</p>
            <pre className="bg-yellow-100 dark:bg-yellow-800 rounded-lg p-2 mt-2 text-xs overflow-x-auto">
              mysql -u root -p samasenbet_hms &lt; backup-file.sql
            </pre>
          </div>
        </div>
      </div>

      {/* Backup list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Backup Files ({backups.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CircleStackIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No backups yet. Create your first backup above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {backups.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-xs">{b.filename}</span>
                        {b === latest && (
                          <span className="badge badge-green text-xs">Latest</span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-gray-500">{fmtSize(b.sizeKB)}</td>
                    <td className="text-sm text-gray-500">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(b.id)}
                          className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20
                                     text-gray-400 hover:text-blue-600 inline-flex"
                          title="Download">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(b.id)}
                          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20
                                     text-gray-400 hover:text-red-600 inline-flex"
                          title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
