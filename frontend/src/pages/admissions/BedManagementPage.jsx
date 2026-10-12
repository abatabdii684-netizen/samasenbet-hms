import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Modal from '@components/common/Modal';
import { PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { wardsAPI } from '@api/wards.api';
import { inventoryAPI } from '@api/inventory.api';
import toast from 'react-hot-toast';

// reuse inventory api just for beds api — actually use a direct fetch via wardsAPI.getBeds
// We'll pull beds per ward using wardsAPI.getById

const BED_TYPES     = ['GENERAL','ICU','ISOLATION','MATERNITY','PEDIATRIC','EMERGENCY'];
const BED_STATUSES  = ['AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED'];

const STATUS_CFG = {
  AVAILABLE:   { cls: 'bg-green-100  border-green-300  text-green-800  dark:bg-green-900/30  dark:text-green-300',  dot: 'bg-green-500'  },
  OCCUPIED:    { cls: 'bg-red-100    border-red-300    text-red-800    dark:bg-red-900/30    dark:text-red-300',    dot: 'bg-red-500'    },
  MAINTENANCE: { cls: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', dot: 'bg-yellow-500' },
  RESERVED:    { cls: 'bg-blue-100   border-blue-300   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',   dot: 'bg-blue-500'   },
};

const EMPTY_BED = { wardId:'', bedNumber:'', type:'GENERAL', notes:'' };

function BedCard({ bed, onStatusChange }) {
  const cfg = STATUS_CFG[bed.status] ?? STATUS_CFG.AVAILABLE;
  const admission = bed.currentAdmission?.[0];

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-all ${cfg.cls}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="font-bold text-sm">{bed.bedNumber}</span>
        </div>
        <span className="text-xs font-medium opacity-70">{bed.type}</span>
      </div>

      {admission ? (
        <div className="text-xs">
          <Link
            to={`/patients/${admission.patient?.id}`}
            className="font-semibold hover:underline truncate block"
          >
            {admission.patient?.firstName} {admission.patient?.lastName}
          </Link>
          <span className="opacity-70">{admission.patient?.patientId}</span>
        </div>
      ) : (
        <p className="text-xs opacity-60 capitalize">{bed.status.toLowerCase()}</p>
      )}

      {bed.status !== 'OCCUPIED' && (
        <select
          value={bed.status}
          onChange={e => onStatusChange(bed.id, e.target.value)}
          className="w-full text-xs rounded-lg border border-current/30 bg-white/50 dark:bg-gray-900/30 px-1.5 py-1 focus:outline-none"
          onClick={e => e.stopPropagation()}
        >
          {BED_STATUSES.filter(s => s !== 'OCCUPIED').map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function BedManagementPage() {
  const [wards,     setWards]     = useState([]);
  const [wardData,  setWardData]  = useState({});  // { wardId: { ...ward, beds: [] } }
  const [loading,   setLoading]   = useState(false);
  const [activeWard,setActiveWard]= useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(EMPTY_BED);
  const [saving,    setSaving]    = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // ── fetch all wards first then load beds lazily per ward ───────────
  const fetchWards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wardsAPI.getAll({ limit: 100 });
      const w   = res.data?.data ?? [];
      setWards(w);
      if (w.length > 0 && !activeWard) setActiveWard(w[0].id);
    } catch { toast.error('Failed to load wards'); }
    finally  { setLoading(false); }
  }, []);

  const fetchWardBeds = useCallback(async (wardId) => {
    try {
      const res = await wardsAPI.getById(wardId);
      const ward = res.data?.data;
      setWardData(prev => ({ ...prev, [wardId]: ward }));
    } catch { toast.error('Failed to load beds'); }
  }, []);

  useEffect(() => { fetchWards(); }, [fetchWards]);
  useEffect(() => { if (activeWard) fetchWardBeds(activeWard); }, [activeWard, fetchWardBeds]);

  // ── update bed status inline ───────────────────────────────────────
  const handleStatusChange = async (bedId, status) => {
    try {
      // call via wards/beds route directly
      const { default: api } = await import('@api/axios');
      await api.patch(`/beds/${bedId}/status`, { status });
      fetchWardBeds(activeWard);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update bed');
    }
  };

  // ── add bed ────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...EMPTY_BED, wardId: activeWard ?? '' });
    setShowAdd(true);
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    if (!form.wardId || !form.bedNumber) { toast.error('Ward and bed number required'); return; }
    setSaving(true);
    try {
      const { default: api } = await import('@api/axios');
      await api.post('/beds', form);
      toast.success('Bed added');
      setShowAdd(false);
      fetchWardBeds(form.wardId);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add bed');
    } finally { setSaving(false); }
  };

  const current = wardData[activeWard];
  const beds    = (current?.beds ?? []).filter(b => !filterStatus || b.status === filterStatus);

  const stats = (current?.beds ?? []).reduce(
    (a, b) => { a[b.status] = (a[b.status] ?? 0) + 1; return a; },
    {}
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bed Management</h1>
          <p className="page-subtitle">Real-time bed occupancy across all wards</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Bed
        </button>
      </div>

      {/* Ward tabs */}
      <div className="card p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {wards.map(w => (
            <button key={w.id} onClick={() => setActiveWard(w.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeWard === w.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}>
              {w.name}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeWard === w.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {w.availableBeds ?? 0}/{w.totalBeds ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats + filter */}
      {current && (
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(STATUS_CFG).map(([s, cfg]) => (
            <button key={s}
              onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                filterStatus === s ? cfg.cls + ' border-2' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              {s} ({stats[s] ?? 0})
            </button>
          ))}
          {filterStatus && (
            <button onClick={() => setFilterStatus('')}
              className="text-xs text-gray-400 hover:text-gray-600 underline">Clear filter</button>
          )}
        </div>
      )}

      {/* Bed grid */}
      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading...</div>
      ) : !current ? (
        <div className="card p-12 text-center text-gray-400">Select a ward above</div>
      ) : beds.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          No beds found {filterStatus ? `with status "${filterStatus}"` : 'in this ward'}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {beds.map(bed => (
            <BedCard key={bed.id} bed={bed} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Add Bed Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Add New Bed" size="sm"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddBed} disabled={saving} className="btn-primary">
              {saving ? 'Adding...' : 'Add Bed'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddBed} className="space-y-4">
          <div>
            <label className="label">Ward *</label>
            <select className="input" value={form.wardId}
              onChange={e => setForm(f => ({ ...f, wardId: e.target.value }))} required>
              <option value="">Select ward...</option>
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bed Number *</label>
              <input type="text" className="input" placeholder="e.g. MW-A-21"
                value={form.bedNumber}
                onChange={e => setForm(f => ({ ...f, bedNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" className="input" placeholder="Optional notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
