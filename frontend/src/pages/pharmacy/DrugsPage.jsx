import React, { useState, useEffect, useCallback } from 'react';
import DataTable  from '@components/common/DataTable';
import Modal      from '@components/common/Modal';
import { PlusIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { pharmacyAPI }   from '@api/pharmacy.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'ANTIBIOTIC','ANALGESIC','NSAID','ANTIHYPERTENSIVE','ANTIDIABETIC',
  'ANTIMALARIAL','ANTIPARASITIC','ANTIFUNGAL','ANTIVIRAL','STEROID',
  'BRONCHODILATOR','PPI','STATIN','HORMONE','OPIOID','IV_FLUID',
  'REHYDRATION','ANXIOLYTIC','VITAMIN','OTHER',
];
const FORMS = ['Tablet','Capsule','Syrup','Injection','Infusion','Inhaler','Cream','Drops','Sachet','Other'];

const EMPTY_DRUG = {
  drugCode:'', genericName:'', brandName:'', category:'ANTIBIOTIC',
  form:'Tablet', strength:'', unit:'tablet', unitPrice:'',
  reorderLevel: 50, requiresPrescription: true,
};

const EMPTY_STOCK = {
  drugId:'', batchNumber:'', quantity:'', expiryDate:'', purchasePrice:'', notes:'',
};

export default function DrugsPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [editDrug,  setEditDrug]  = useState(null);   // drug being edited
  const [stockDrug, setStockDrug] = useState(null);   // drug receiving stock
  const [form,      setForm]      = useState(EMPTY_DRUG);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);
  const [saving,    setSaving]    = useState(false);
  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyAPI.getAllDrugs({
        page, limit,
        search:   debounced || undefined,
        category: category  || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load drugs');
    } finally { setLoading(false); }
  }, [page, limit, debounced, category]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { resetPage(); }, [debounced, category]);

  // ── open add / edit ──────────────────────────────────────────────
  const openAdd = () => { setEditDrug(null); setForm(EMPTY_DRUG); setShowAdd(true); };
  const openEdit = (drug) => {
    setEditDrug(drug);
    setForm({
      drugCode:             drug.drugCode,
      genericName:          drug.genericName,
      brandName:            drug.brandName || '',
      category:             drug.category,
      form:                 drug.form,
      strength:             drug.strength || '',
      unit:                 drug.unit,
      unitPrice:            drug.unitPrice,
      reorderLevel:         drug.reorderLevel,
      requiresPrescription: drug.requiresPrescription,
    });
    setShowAdd(true);
  };

  const closeAdd = () => { setShowAdd(false); setForm(EMPTY_DRUG); setEditDrug(null); };

  const handleSaveDrug = async (e) => {
    e.preventDefault();
    if (!form.drugCode || !form.genericName) {
      toast.error('Drug code and generic name are required'); return;
    }
    setSaving(true);
    try {
      if (editDrug) {
        await pharmacyAPI.updateDrug(editDrug.id, form);
        toast.success('Drug updated');
      } else {
        await pharmacyAPI.createDrug(form);
        toast.success('Drug added to catalog');
      }
      closeAdd();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save drug');
    } finally { setSaving(false); }
  };

  // ── add stock ────────────────────────────────────────────────────
  const openAddStock = (drug) => {
    setStockDrug(drug);
    setStockForm({ ...EMPTY_STOCK, drugId: drug.id });
    setShowStock(true);
  };

  const closeStock = () => { setShowStock(false); setStockDrug(null); setStockForm(EMPTY_STOCK); };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockForm.batchNumber || !stockForm.quantity || !stockForm.expiryDate) {
      toast.error('Batch number, quantity and expiry date are required'); return;
    }
    setSaving(true);
    try {
      await pharmacyAPI.addStock(stockForm);
      toast.success('Stock added successfully');
      closeStock();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add stock');
    } finally { setSaving(false); }
  };

  // ── columns ──────────────────────────────────────────────────────
  const columns = [
    {
      key: 'drugCode', label: 'Code', sortable: true,
      render: (v) => <span className="font-mono text-xs font-semibold">{v}</span>,
    },
    {
      key: 'genericName', label: 'Generic Name', sortable: true,
      render: (v, r) => (
        <div>
          <div className="font-medium">{v}</div>
          {r.brandName && <div className="text-xs text-gray-400">{r.brandName}</div>}
        </div>
      ),
    },
    {
      key: 'category', label: 'Category',
      render: (v) => <span className="badge badge-blue text-xs">{v}</span>,
    },
    {
      key: 'form', label: 'Form / Strength',
      render: (_, r) => `${r.form} · ${r.strength || '—'}`,
    },
    {
      key: 'unitPrice', label: 'Unit Price',
      render: (v) => `ETB ${parseFloat(v).toFixed(2)}`,
    },
    {
      key: 'totalStock', label: 'Stock',
      render: (v, r) => {
        const low = v <= r.reorderLevel;
        return (
          <div className="flex items-center gap-1">
            <span className={`font-semibold ${low ? 'text-red-600' : 'text-green-600'}`}>
              {v ?? 0}
            </span>
            <span className="text-xs text-gray-400">{r.unit}</span>
            {low && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: 'requiresPrescription', label: 'Rx',
      render: (v) => v
        ? <span className="badge badge-yellow">Required</span>
        : <span className="badge badge-gray">OTC</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openAddStock(r)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                       text-gray-400 hover:text-green-600 inline-flex"
            title="Add Stock">
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                       text-gray-400 hover:text-primary-600 inline-flex"
            title="Edit Drug">
            <PlusIcon className="w-4 h-4 rotate-45" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Drug Catalog</h1>
          <p className="page-subtitle">Manage drugs, stock levels, and pricing</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Drug
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" className="input"
            placeholder="Search drug name, code..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No drugs found"
      />

      {/* Add / Edit Drug Modal */}
      <Modal isOpen={showAdd} onClose={closeAdd}
        title={editDrug ? 'Edit Drug' : 'Add New Drug'} size="lg"
        footer={
          <>
            <button onClick={closeAdd} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveDrug} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editDrug ? 'Save Changes' : 'Add Drug'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveDrug} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Drug Code *</label>
              <input type="text" className="input" placeholder="DRG-XXX"
                value={form.drugCode}
                onChange={e => setForm(f => ({ ...f, drugCode: e.target.value }))}
                required disabled={!!editDrug} />
            </div>
            <div>
              <label className="label">Generic Name *</label>
              <input type="text" className="input" placeholder="e.g. Amoxicillin"
                value={form.genericName}
                onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Brand Name</label>
              <input type="text" className="input" placeholder="e.g. Amoxil"
                value={form.brandName}
                onChange={e => setForm(f => ({ ...f, brandName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Form</label>
              <select className="input" value={form.form}
                onChange={e => setForm(f => ({ ...f, form: e.target.value }))}>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Strength</label>
              <input type="text" className="input" placeholder="e.g. 500mg"
                value={form.strength}
                onChange={e => setForm(f => ({ ...f, strength: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input type="text" className="input" placeholder="tablet / vial / sachet..."
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit Price (ETB)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={form.unitPrice}
                onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" className="input" placeholder="50"
                value={form.reorderLevel}
                onChange={e => setForm(f => ({ ...f, reorderLevel: parseInt(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="reqRx" className="w-4 h-4 accent-primary-600"
                checked={form.requiresPrescription}
                onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))} />
              <label htmlFor="reqRx" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Requires Prescription
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Stock Modal */}
      <Modal isOpen={showStock} onClose={closeStock}
        title={`Add Stock — ${stockDrug?.genericName}`} size="md"
        footer={
          <>
            <button onClick={closeStock} className="btn-secondary">Cancel</button>
            <button onClick={handleAddStock} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Add Stock'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddStock} className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            Drug: <strong>{stockDrug?.genericName}</strong> ({stockDrug?.strength}) ·
            Current stock: <strong>{stockDrug?.totalStock ?? 0} {stockDrug?.unit}</strong>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Batch Number *</label>
              <input type="text" className="input" placeholder="e.g. BCH-2026-001"
                value={stockForm.batchNumber}
                onChange={e => setStockForm(f => ({ ...f, batchNumber: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input" placeholder="100"
                value={stockForm.quantity}
                onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Expiry Date *</label>
              <input type="date" className="input"
                value={stockForm.expiryDate}
                onChange={e => setStockForm(f => ({ ...f, expiryDate: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Purchase Price (ETB/unit)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={stockForm.purchasePrice}
                onChange={e => setStockForm(f => ({ ...f, purchasePrice: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" className="input" placeholder="Optional notes..."
              value={stockForm.notes}
              onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
