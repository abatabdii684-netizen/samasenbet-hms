import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@components/common/Modal';
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { wardsAPI } from '@api/wards.api';
import toast from 'react-hot-toast';

const WARD_TYPES = ['MEDICAL','SURGICAL','MATERNITY','PEDIATRIC','ICU','EMERGENCY','ISOLATION','GENERAL'];

const EMPTY = { name:'', code:'', type:'GENERAL', floor:'', totalBeds: 10, description:'' };

function OccupancyBar({ available, total }) {
  const pct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{total - available} / {total} occupied</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function WardPage() {
  const [wards,   setWards]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editWard,setEditWard]= useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const fetchWards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wardsAPI.getAll({ limit: 100 });
      setWards(res.data?.data ?? []);
    } catch { toast.error('Failed to load wards'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchWards(); }, [fetchWards]);

  const openAdd = () => { setEditWard(null); setForm(EMPTY); setShowAdd(true); };
  const openEdit = (w) => {
    setEditWard(w);
    setForm({ name: w.name, code: w.code, type: w.type, floor: w.floor ?? '', totalBeds: w.totalBeds ?? 0, description: w.description ?? '' });
    setShowAdd(true);
  };
  const closeAdd = () => { setShowAdd(false); setForm(EMPTY); setEditWard(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Name and code required'); return; }
    setSaving(true);
    try {
      if (editWard) {
        await wardsAPI.update(editWard.id, form);
        toast.success('Ward updated');
      } else {
        await wardsAPI.create(form);
        toast.success('Ward created');
      }
      closeAdd();
      fetchWards();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save ward');
    } finally { setSaving(false); }
  };

  const totalStats = wards.reduce(
    (a, w) => ({ beds: a.beds + (w.totalBeds ?? 0), available: a.available + (w.availableBeds ?? 0) }),
    { beds: 0, available: 0 }
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Wards</h1>
          <p className="page-subtitle">
            {wards.length} wards · {totalStats.available} / {totalStats.beds} beds available
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Ward
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading wards...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map(w => (
            <div key={w.id} className="card p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{w.name}</h3>
                    <p className="text-xs text-gray-400">{w.code} · Floor {w.floor ?? '—'}</p>
                  </div>
                </div>
                <span className="badge badge-blue text-xs">{w.type}</span>
              </div>

              <OccupancyBar available={w.availableBeds ?? 0} total={w.totalBeds ?? 0} />

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Total',     value: w.totalBeds     ?? 0, cls: 'text-gray-900 dark:text-white' },
                  { label: 'Available', value: w.availableBeds ?? 0, cls: 'text-green-600' },
                  { label: 'Occupied',  value: w.occupiedBeds  ?? 0, cls: 'text-red-600'   },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                    <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => openEdit(w)}
                className="w-full btn-secondary text-sm py-1.5">
                Edit Ward
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={closeAdd}
        title={editWard ? 'Edit Ward' : 'Add Ward'} size="md"
        footer={
          <>
            <button onClick={closeAdd} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editWard ? 'Save Changes' : 'Create Ward'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ward Name *</label>
              <input type="text" className="input" placeholder="e.g. Medical Ward A"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Code *</label>
              <input type="text" className="input" placeholder="e.g. MW-A"
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                required disabled={!!editWard} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {WARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Floor</label>
              <input type="number" className="input" placeholder="0"
                value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Beds</label>
              <input type="number" className="input" placeholder="10" min="1"
                value={form.totalBeds} onChange={e => setForm(f => ({ ...f, totalBeds: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2}
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
