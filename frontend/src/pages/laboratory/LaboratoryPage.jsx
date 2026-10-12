import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import {
  EyeIcon, BeakerIcon, CheckCircleIcon,
  ClockIcon, PlusIcon, MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { laboratoryAPI } from '@api/laboratory.api';
import { patientsAPI }   from '@api/patients.api';
import { usePagination }  from '@hooks/usePagination';
import { useDebounce }    from '@hooks/useDebounce';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED'];

const LAB_CATEGORIES = [
  'HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'SEROLOGY',
  'PARASITOLOGY', 'URINE', 'IMMUNOLOGY', 'ENDOCRINOLOGY',
];

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

const EMPTY_TEST = {
  testCode: '', testName: '', category: 'HEMATOLOGY',
  price: '', turnaround: '', unit: '', normalRange: '',
};

export default function LaboratoryPage() {
  // ── orders state ──────────────────────────────────────────────────
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats,   setStats]   = useState({ pending:0, inProgress:0, completed:0, approved:0 });
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [date,    setDate]    = useState('');

  // ── test catalog state ────────────────────────────────────────────
  const [tests,       setTests]       = useState([]);
  const [testTotal,   setTestTotal]   = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [testSearch,  setTestSearch]  = useState('');
  const [testCat,     setTestCat]     = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [testForm,    setTestForm]    = useState(EMPTY_TEST);
  const [saving,      setSaving]      = useState(false);

  // ── new order state ──────────────────────────────────────────────
  const [showOrder,     setShowOrder]     = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients,      setPatients]      = useState([]);
  const [selectedPt,    setSelectedPt]    = useState(null);
  const [allTests,      setAllTests]      = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [orderUrgency,  setOrderUrgency]  = useState('ROUTINE');
  const [sampleType,    setSampleType]    = useState('');
  const [clinicalInfo,  setClinicalInfo]  = useState('');
  const [ptSearching,   setPtSearching]   = useState(false);
  const [orderSaving,   setOrderSaving]   = useState(false);

  // ── shared ────────────────────────────────────────────────────────
  const [tab, setTab] = useState('orders');
  const debounced     = useDebounce(search);
  const testDebounced = useDebounce(testSearch);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── fetch orders ──────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laboratoryAPI.getAll({
        page, limit,
        search: debounced || undefined,
        status: status    || undefined,
        date:   date      || undefined,
      });
      const d = res.data;
      setData(d.data ?? []);
      setTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load lab orders');
    } finally { setLoading(false); }
  }, [page, limit, debounced, status, date]);

  // derive stats
  useEffect(() => {
    const s = { pending:0, inProgress:0, completed:0, approved:0 };
    data.forEach(o => {
      if (o.status === 'PENDING')     s.pending++;
      if (o.status === 'IN_PROGRESS') s.inProgress++;
      if (o.status === 'COMPLETED')   s.completed++;
      if (o.status === 'APPROVED')    s.approved++;
    });
    setStats(s);
  }, [data]);

  useEffect(() => { fetchOrders(); },  [fetchOrders]);
  useEffect(() => { resetPage(); },    [debounced, status, date]);

  // ── fetch test catalog ────────────────────────────────────────────
  const fetchTests = useCallback(async () => {
    setTestLoading(true);
    try {
      const res = await laboratoryAPI.getAllTests({
        page: 1, limit: 200,
        search:   testDebounced || undefined,
        category: testCat       || undefined,
      });
      const d = res.data;
      setTests(d.data ?? []);
      setTestTotal(d.meta?.pagination?.total ?? d.total ?? 0);
    } catch {
      toast.error('Failed to load test catalog');
    } finally { setTestLoading(false); }
  }, [testDebounced, testCat]);

  useEffect(() => {
    if (tab === 'catalog') fetchTests();
  }, [tab, fetchTests]);

  // ── add test ──────────────────────────────────────────────────────
  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!testForm.testCode || !testForm.testName) {
      toast.error('Test code and name are required'); return;
    }
    setSaving(true);
    try {
      await laboratoryAPI.createTest({
        ...testForm,
        price:      parseFloat(testForm.price)      || 0,
        turnaround: parseInt(testForm.turnaround)   || 0,
      });
      toast.success('Test added to catalog');
      setShowAdd(false);
      setTestForm(EMPTY_TEST);
      fetchTests();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add test');
    } finally { setSaving(false); }
  };

  // ── new order: search patients ───────────────────────────────────
  const searchPatients = async (q) => {
    setPatientSearch(q);
    if (!q || q.length < 2) { setPatients([]); return; }
    setPtSearching(true);
    try {
      const res = await patientsAPI.getAll({ search: q, limit: 20 });
      setPatients(res.data?.data ?? []);
    } catch { /* silent */ }
    finally { setPtSearching(false); }
  };

  const openOrderModal = async () => {
    setShowOrder(true);
    setSelectedPt(null);
    setSelectedTests([]);
    setPatientSearch('');
    setPatients([]);
    setOrderUrgency('ROUTINE');
    setSampleType('');
    setClinicalInfo('');
    // load all tests for selection
    try {
      const res = await laboratoryAPI.getAllTests({ page: 1, limit: 500 });
      setAllTests(res.data?.data ?? []);
    } catch { toast.error('Failed to load tests'); }
  };

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const handleCreateOrder = async () => {
    if (!selectedPt)           { toast.error('Select a patient');       return; }
    if (selectedTests.length === 0) { toast.error('Select at least one test'); return; }
    setOrderSaving(true);
    try {
      await laboratoryAPI.create({
        patientId:   selectedPt.id,
        testIds:     selectedTests.map(t => t.id),
        urgency:     orderUrgency,
        sampleType:  sampleType  || undefined,
        clinicalInfo:clinicalInfo|| undefined,
      });
      toast.success('Lab order created successfully');
      setShowOrder(false);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create order');
    } finally { setOrderSaving(false); }
  };

  // ── columns ───────────────────────────────────────────────────────
  const orderColumns = [
    {
      key: 'orderNo', label: 'Order No', sortable: true,
      render: (v, r) => r.id ? (
        <Link to={`/laboratory/${r.id}`}
          className="font-mono text-xs font-semibold text-primary-600 hover:underline">
          {v}
        </Link>
      ) : <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'patient', label: 'Patient',
      render: (_, r) => r.patient ? (
        <div>
          <div className="font-medium">{r.patient.firstName} {r.patient.lastName}</div>
          <div className="text-xs text-gray-400">{r.patient.patientId}</div>
        </div>
      ) : '—',
    },
    {
      key: 'doctor', label: 'Doctor',
      render: (_, r) => r.doctor
        ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}`
        : '—',
    },
    {
      key: 'items', label: 'Tests',
      render: (v) => <span className="badge badge-blue">{v?.length ?? 0} test(s)</span>,
    },
    {
      key: 'urgency', label: 'Urgency',
      render: (v) => {
        const cls = v === 'STAT' ? 'badge-red' : v === 'URGENT' ? 'badge-yellow' : 'badge-gray';
        return <span className={`badge ${cls}`}>{v || '—'}</span>;
      },
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'technician', label: 'Technician',
      render: (_, r) => r.technician
        ? `${r.technician.firstName} ${r.technician.lastName}`
        : <span className="text-gray-400 text-xs">Unassigned</span>,
    },
    {
      key: 'actions', label: '',
      render: (_, r) => r.id ? (
        <Link to={`/laboratory/${r.id}`}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                     text-gray-400 hover:text-primary-600 inline-flex"
          title="View Order">
          <EyeIcon className="w-4 h-4" />
        </Link>
      ) : null,
    },
  ];

  const testColumns = [
    {
      key: 'testCode', label: 'Code',
      render: (v) => <span className="font-mono text-xs font-semibold">{v}</span>,
    },
    { key: 'testName', label: 'Test Name', sortable: true },
    {
      key: 'category', label: 'Category',
      render: (v) => <span className="badge badge-blue text-xs">{v}</span>,
    },
    {
      key: 'price', label: 'Price',
      render: (v) => `ETB ${parseFloat(v || 0).toFixed(2)}`,
    },
    {
      key: 'turnaround', label: 'TAT',
      render: (v) => v ? `${v}h` : '—',
    },
    { key: 'unit',        label: 'Unit' },
    { key: 'normalRange', label: 'Normal Range' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Laboratory</h1>
          <p className="page-subtitle">Manage lab orders, results and test catalog</p>
        </div>
        <div className="flex gap-2">
          {tab === 'orders' && (
            <button onClick={openOrderModal} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> New Order
            </button>
          )}
          {tab === 'catalog' && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <PlusIcon className="w-4 h-4" /> Add Test
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ClockIcon}       label="Pending"     value={stats.pending}    color="text-yellow-600 bg-yellow-50" />
        <StatCard icon={BeakerIcon}      label="In Progress" value={stats.inProgress} color="text-blue-600   bg-blue-50"   />
        <StatCard icon={CheckCircleIcon} label="Completed"   value={stats.completed}  color="text-green-600  bg-green-50"  />
        <StatCard icon={CheckCircleIcon} label="Approved"    value={stats.approved}   color="text-purple-600 bg-purple-50" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1">
          {[
            { key: 'orders',  label: 'Lab Orders'   },
            { key: 'catalog', label: 'Test Catalog'  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <>
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" className="input"
                placeholder="Search order no or patient..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <input type="date" className="input"
                value={date} onChange={e => setDate(e.target.value)} />
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={orderColumns} data={data} loading={loading}
            pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
            onPageChange={goToPage} emptyText="No lab orders found"
          />
        </>
      )}

      {/* Catalog tab */}
      {tab === 'catalog' && (
        <>
          <div className="card p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" className="input"
                placeholder="Search test name or code..."
                value={testSearch} onChange={e => setTestSearch(e.target.value)} />
              <select className="input" value={testCat} onChange={e => setTestCat(e.target.value)}>
                <option value="">All Categories</option>
                {LAB_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={testColumns} data={tests} loading={testLoading}
            pagination={{ page: 1, limit: 200, total: testTotal, totalPages: 1 }}
            onPageChange={() => {}} emptyText="No tests in catalog"
          />
        </>
      )}

      {/* ── New Lab Order Modal ── */}
      <Modal isOpen={showOrder} onClose={() => setShowOrder(false)}
        title="New Lab Order" size="xl"
        footer={
          <>
            <button onClick={() => setShowOrder(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateOrder} disabled={orderSaving} className="btn-primary">
              {orderSaving ? 'Creating...' : `Create Order (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`}
            </button>
          </>
        }
      >
        <div className="space-y-5">

          {/* Patient Search */}
          <div>
            <label className="label">Patient *</label>
            {selectedPt ? (
              <div className="flex items-center justify-between rounded-lg border border-primary-300 bg-primary-50 dark:bg-primary-900/20 p-3">
                <div>
                  <p className="font-semibold text-primary-700 dark:text-primary-300">
                    {selectedPt.firstName} {selectedPt.lastName}
                  </p>
                  <p className="text-xs text-primary-500">{selectedPt.patientId} · {selectedPt.phone}</p>
                </div>
                <button onClick={() => { setSelectedPt(null); setPatients([]); setPatientSearch(''); }}
                  className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-500">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" className="input pl-9"
                      placeholder="Type patient name or ID to search..."
                      value={patientSearch}
                      onChange={e => searchPatients(e.target.value)} />
                  </div>
                </div>
                {patients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-48 overflow-y-auto">
                    {patients.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedPt(p); setPatients([]); setPatientSearch(''); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{p.patientId} · {p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {ptSearching && (
                  <p className="text-xs text-gray-400 mt-1">Searching...</p>
                )}
                {patientSearch.length >= 2 && !ptSearching && patients.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No patients found for "{patientSearch}"</p>
                )}
              </div>
            )}
          </div>

          {/* Urgency & Sample */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Urgency</label>
              <select className="input" value={orderUrgency} onChange={e => setOrderUrgency(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
            <div>
              <label className="label">Sample Type</label>
              <input type="text" className="input" placeholder="e.g. Blood, Urine, Stool"
                value={sampleType} onChange={e => setSampleType(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Clinical Information</label>
              <input type="text" className="input" placeholder="Brief clinical notes for the technician..."
                value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)} />
            </div>
          </div>

          {/* Test Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Select Tests *</label>
              {selectedTests.length > 0 && (
                <span className="text-xs text-primary-600 font-medium">
                  {selectedTests.length} selected
                </span>
              )}
            </div>

            {/* Selected tests chips */}
            {selectedTests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                {selectedTests.map(t => (
                  <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 text-xs font-medium">
                    {t.testName}
                    <button onClick={() => toggleTest(t)}
                      className="hover:text-primary-900 dark:hover:text-white">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tests grouped by category */}
            <div className="max-h-56 overflow-y-auto scrollbar-thin border border-gray-200 dark:border-gray-700 rounded-lg">
              {Object.entries(
                allTests.reduce((acc, t) => {
                  if (!acc[t.category]) acc[t.category] = [];
                  acc[t.category].push(t);
                  return acc;
                }, {})
              ).map(([cat, catTests]) => (
                <div key={cat}>
                  <div className="sticky top-0 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold
                    text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    {cat}
                  </div>
                  {catTests.map(t => {
                    const selected = !!selectedTests.find(s => s.id === t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleTest(t)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm
                          border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors
                          ${selected
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selected
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selected && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={selected ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                            {t.testName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          ETB {parseFloat(t.price || 0).toFixed(0)} · {t.turnaround}h
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Test Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)}
        title="Add Test to Catalog" size="md"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddTest} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Add Test'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Test Code *</label>
              <input type="text" className="input" placeholder="e.g. LAB-CBC"
                value={testForm.testCode}
                onChange={e => setTestForm(f => ({ ...f, testCode: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Test Name *</label>
              <input type="text" className="input" placeholder="e.g. Complete Blood Count"
                value={testForm.testName}
                onChange={e => setTestForm(f => ({ ...f, testName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={testForm.category}
                onChange={e => setTestForm(f => ({ ...f, category: e.target.value }))}>
                {LAB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (ETB)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={testForm.price}
                onChange={e => setTestForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Turnaround (hours)</label>
              <input type="number" className="input" placeholder="4"
                value={testForm.turnaround}
                onChange={e => setTestForm(f => ({ ...f, turnaround: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input type="text" className="input" placeholder="e.g. mg/dL"
                value={testForm.unit}
                onChange={e => setTestForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Normal Range</label>
              <input type="text" className="input" placeholder="e.g. 70–100 mg/dL"
                value={testForm.normalRange}
                onChange={e => setTestForm(f => ({ ...f, normalRange: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
