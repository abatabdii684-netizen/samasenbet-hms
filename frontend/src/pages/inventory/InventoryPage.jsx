import React, { useState, useEffect, useCallback } from 'react';
import DataTable  from '@components/common/DataTable';
import Modal      from '@components/common/Modal';
import {
  PlusIcon, ArrowUpIcon, ArrowDownIcon,
  ExclamationTriangleIcon, CubeIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { inventoryAPI }  from '@api/inventory.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';

// ── empty form templates ───────────────────────────────────────────
const EMPTY_ITEM = {
  itemCode: '', name: '', categoryId: '', unit: '',
  quantity: 0, reorderLevel: 5, unitCost: '', location: '',
};
const EMPTY_MOVEMENT = { quantity: '', reference: '', reason: '' };

// ── stat card ─────────────────────────────────────────────────────
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

export default function InventoryPage() {
  const [data,       setData]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState([]);
  const [lowStock,   setLowStock]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tab,        setTab]        = useState('items'); // items | low-stock | movements

  // modals
  const [showAdd,  setShowAdd]  = useState(false);
  const [showIn,   setShowIn]   = useState(false);
  const [showOut,  setShowOut]  = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // for stock in/out
  const [movements,  setMovements]  = useState([]);

  const [form,      setForm]      = useState(EMPTY_ITEM);
  const [mvForm,    setMvForm]    = useState(EMPTY_MOVEMENT);
  const [saving,    setSaving]    = useState(false);

  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch items ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll({
        page, limit,
        search:     debounced  || undefined,
        categoryId: categoryId || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load inventory');
    } finally { setLoading(false); }
  }, [page, limit, debounced, categoryId]);

  // ── fetch categories & low stock ──────────────────────────────────
  const fetchMeta = useCallback(async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        inventoryAPI.getCategories(),
        inventoryAPI.getLowStock(),
      ]);
      setCategories(cRes.data?.data ?? []);
      setLowStock(lRes.data?.data   ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); },  [fetchData]);
  useEffect(() => { fetchMeta(); },  [fetchMeta]);
  useEffect(() => { resetPage(); },  [debounced, categoryId]);

  // ── open item detail / movements ──────────────────────────────────
  const openMovements = async (item) => {
    try {
      const res = await inventoryAPI.getById(item.id);
      setMovements(res.data?.data?.movements ?? []);
      setActiveItem(res.data?.data);
      setTab('movements');
    } catch { toast.error('Failed to load movements'); }
  };

  // ── add / edit item ───────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_ITEM);
    setShowAdd(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      itemCode:     item.itemCode,
      name:         item.name,
      categoryId:   item.categoryId,
      unit:         item.unit,
      quantity:     item.quantity,
      reorderLevel: item.reorderLevel,
      unitCost:     item.unitCost,
      location:     item.location || '',
    });
    setShowAdd(true);
  };

  const closeAdd = () => { setShowAdd(false); setForm(EMPTY_ITEM); setEditItem(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.itemCode || !form.name || !form.categoryId) {
      toast.error('Code, name and category are required'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await inventoryAPI.update(editItem.id, form);
        toast.success('Item updated');
      } else {
        await inventoryAPI.create(form);
        toast.success('Item added');
      }
      closeAdd();
      fetchData();
      fetchMeta();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save item');
    } finally { setSaving(false); }
  };

  // ── stock in ──────────────────────────────────────────────────────
  const openStockIn = (item) => {
    setActiveItem(item);
    setMvForm(EMPTY_MOVEMENT);
    setShowIn(true);
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!mvForm.quantity || parseInt(mvForm.quantity) <= 0) {
      toast.error('Enter a valid quantity'); return;
    }
    setSaving(true);
    try {
      await inventoryAPI.stockIn(activeItem.id, mvForm);
      toast.success(`+${mvForm.quantity} ${activeItem.unit} added`);
      setShowIn(false);
      fetchData();
      fetchMeta();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add stock');
    } finally { setSaving(false); }
  };

  // ── stock out ─────────────────────────────────────────────────────
  const openStockOut = (item) => {
    setActiveItem(item);
    setMvForm(EMPTY_MOVEMENT);
    setShowOut(true);
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    if (!mvForm.quantity || parseInt(mvForm.quantity) <= 0) {
      toast.error('Enter a valid quantity'); return;
    }
    setSaving(true);
    try {
      await inventoryAPI.stockOut(activeItem.id, mvForm);
      toast.success(`-${mvForm.quantity} ${activeItem.unit} removed`);
      setShowOut(false);
      fetchData();
      fetchMeta();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove stock');
    } finally { setSaving(false); }
  };

  // ── delete ────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from inventory?`)) return;
    try {
      await inventoryAPI.remove(item.id);
      toast.success('Item removed');
      fetchData();
      fetchMeta();
    } catch { toast.error('Failed to remove item'); }
  };

  // ── stats ─────────────────────────────────────────────────────────
  const totalItems   = total;
  const lowStockCount = lowStock.length;
  const totalValue   = data.reduce((s, i) => s + (i.quantity * parseFloat(i.unitCost || 0)), 0);

  // ── columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: 'itemCode', label: 'Code', sortable: true,
      render: (v) => <span className="font-mono text-xs font-semibold">{v}</span>,
    },
    {
      key: 'name', label: 'Item Name', sortable: true,
      render: (v, r) => (
        <div>
          <div className="font-medium">{v}</div>
          <div className="text-xs text-gray-400">{r.category?.name}</div>
        </div>
      ),
    },
    {
      key: 'quantity', label: 'Qty in Stock',
      render: (v, r) => {
        const low = v <= r.reorderLevel;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-base ${low ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
              {v}
            </span>
            <span className="text-xs text-gray-400">{r.unit}</span>
            {low && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500" title="Low stock" />}
          </div>
        );
      },
    },
    {
      key: 'reorderLevel', label: 'Reorder At',
      render: (v, r) => `${v} ${r.unit}`,
    },
    {
      key: 'unitCost', label: 'Unit Cost',
      render: (v) => `ETB ${parseFloat(v || 0).toFixed(2)}`,
    },
    {
      key: 'location', label: 'Location',
      render: (v) => v || <span className="text-gray-400 text-xs">—</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openStockIn(r)} title="Stock In"
            className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 inline-flex">
            <ArrowUpIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openStockOut(r)} title="Stock Out"
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 inline-flex">
            <ArrowDownIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openMovements(r)} title="View Movements"
            className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 inline-flex">
            <ClockIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)} title="Edit"
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 inline-flex">
            <CubeIcon className="w-4 h-4" />
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
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Manage hospital supplies, equipment and stock levels</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={CubeIcon}               label="Total Items"   value={totalItems}    color="text-blue-600   bg-blue-50"   />
        <StatCard icon={ExclamationTriangleIcon} label="Low Stock"     value={lowStockCount} color="text-red-600    bg-red-50"    />
        <StatCard icon={ArrowUpIcon}             label="Stock Value"
          value={`ETB ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          color="text-green-600 bg-green-50" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {[
            { key: 'items',     label: 'All Items'                           },
            { key: 'low-stock', label: `Low Stock (${lowStockCount})`        },
            { key: 'movements', label: activeItem ? `Movements — ${activeItem.name}` : 'Movements' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Items tab ── */}
      {tab === 'items' && (
        <>
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" className="input"
                placeholder="Search item name or code..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={columns} data={data} loading={loading}
            pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
            onPageChange={goToPage} emptyText="No inventory items found"
          />
        </>
      )}

      {/* ── Low Stock tab ── */}
      {tab === 'low-stock' && (
        <div className="card overflow-hidden">
          {lowStock.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              All items are adequately stocked
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th><th>Item Name</th><th>Category</th>
                    <th>Current Stock</th><th>Reorder Level</th><th>Deficit</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {lowStock.map(item => (
                    <tr key={item.id}>
                      <td><span className="font-mono text-xs">{item.itemCode}</span></td>
                      <td className="font-medium">{item.name}</td>
                      <td className="text-sm text-gray-500">{item.category?.name}</td>
                      <td>
                        <span className="text-red-600 font-bold">{item.quantity}</span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="text-gray-500">{item.reorderLevel} {item.unit}</td>
                      <td>
                        <span className="badge badge-red">
                          -{item.reorderLevel - item.quantity} {item.unit}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openStockIn(item)}
                          className="btn-success py-1 px-2 text-xs">
                          <ArrowUpIcon className="w-3 h-3" /> Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Movements tab ── */}
      {tab === 'movements' && (
        <div className="card overflow-hidden">
          {!activeItem ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Click the clock icon on any item to view its stock movements
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No movements recorded for <strong>{activeItem.name}</strong>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{activeItem.name}</h3>
                  <p className="text-xs text-gray-400">
                    {activeItem.itemCode} · Current stock: {activeItem.quantity} {activeItem.unit}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openStockIn(activeItem)} className="btn-success py-1 px-3 text-xs">
                    <ArrowUpIcon className="w-3 h-3" /> In
                  </button>
                  <button onClick={() => openStockOut(activeItem)} className="btn-danger py-1 px-3 text-xs">
                    <ArrowDownIcon className="w-3 h-3" /> Out
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Quantity</th><th>Reference</th><th>Reason</th></tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {movements.map(m => (
                      <tr key={m.id}>
                        <td className="text-sm">{new Date(m.createdAt).toLocaleString()}</td>
                        <td>
                          {m.type === 'IN'
                            ? <span className="badge badge-green flex items-center gap-1 w-fit">
                                <ArrowUpIcon className="w-3 h-3" /> IN
                              </span>
                            : <span className="badge badge-red flex items-center gap-1 w-fit">
                                <ArrowDownIcon className="w-3 h-3" /> OUT
                              </span>
                          }
                        </td>
                        <td className={`font-bold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity} {activeItem.unit}
                        </td>
                        <td className="text-sm text-gray-500">{m.reference || '—'}</td>
                        <td className="text-sm text-gray-500">{m.reason    || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add / Edit Item Modal ── */}
      <Modal isOpen={showAdd} onClose={closeAdd}
        title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'} size="md"
        footer={
          <>
            <button onClick={closeAdd} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Item'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Item Code *</label>
              <input type="text" className="input" placeholder="INV-XXX"
                value={form.itemCode}
                onChange={e => setForm(f => ({ ...f, itemCode: e.target.value }))}
                required disabled={!!editItem} />
            </div>
            <div>
              <label className="label">Item Name *</label>
              <input type="text" className="input" placeholder="e.g. Surgical Gloves"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                required>
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <input type="text" className="input" placeholder="box / piece / pack..."
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Initial Quantity</label>
              <input type="number" className="input" placeholder="0"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input type="number" className="input" placeholder="5"
                value={form.reorderLevel}
                onChange={e => setForm(f => ({ ...f, reorderLevel: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit Cost (ETB)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={form.unitCost}
                onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} />
            </div>
            <div>
              <label className="label">Storage Location</label>
              <input type="text" className="input" placeholder="e.g. Store A, Shelf 3"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Stock In Modal ── */}
      <Modal isOpen={showIn} onClose={() => setShowIn(false)}
        title={`Stock In — ${activeItem?.name}`} size="sm"
        footer={
          <>
            <button onClick={() => setShowIn(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStockIn} disabled={saving} className="btn-success">
              {saving ? 'Adding...' : 'Add Stock'}
            </button>
          </>
        }
      >
        <form onSubmit={handleStockIn} className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
            Current stock: <strong>{activeItem?.quantity ?? 0} {activeItem?.unit}</strong>
          </div>
          <div>
            <label className="label">Quantity to Add *</label>
            <input type="number" className="input" placeholder="0" min="1"
              value={mvForm.quantity}
              onChange={e => setMvForm(f => ({ ...f, quantity: e.target.value }))}
              required />
          </div>
          <div>
            <label className="label">Reference / PO Number</label>
            <input type="text" className="input" placeholder="e.g. PO-2026-001"
              value={mvForm.reference}
              onChange={e => setMvForm(f => ({ ...f, reference: e.target.value }))} />
          </div>
          <div>
            <label className="label">Reason</label>
            <input type="text" className="input" placeholder="e.g. Monthly restock"
              value={mvForm.reason}
              onChange={e => setMvForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* ── Stock Out Modal ── */}
      <Modal isOpen={showOut} onClose={() => setShowOut(false)}
        title={`Stock Out — ${activeItem?.name}`} size="sm"
        footer={
          <>
            <button onClick={() => setShowOut(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStockOut} disabled={saving} className="btn-danger">
              {saving ? 'Processing...' : 'Remove Stock'}
            </button>
          </>
        }
      >
        <form onSubmit={handleStockOut} className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            Available stock: <strong>{activeItem?.quantity ?? 0} {activeItem?.unit}</strong>
          </div>
          <div>
            <label className="label">Quantity to Remove *</label>
            <input type="number" className="input" placeholder="0" min="1"
              max={activeItem?.quantity}
              value={mvForm.quantity}
              onChange={e => setMvForm(f => ({ ...f, quantity: e.target.value }))}
              required />
          </div>
          <div>
            <label className="label">Reference</label>
            <input type="text" className="input" placeholder="e.g. Ward request"
              value={mvForm.reference}
              onChange={e => setMvForm(f => ({ ...f, reference: e.target.value }))} />
          </div>
          <div>
            <label className="label">Reason *</label>
            <input type="text" className="input" placeholder="e.g. Issued to OPD"
              value={mvForm.reason}
              onChange={e => setMvForm(f => ({ ...f, reason: e.target.value }))}
              required />
          </div>
        </form>
      </Modal>
    </div>
  );
}
