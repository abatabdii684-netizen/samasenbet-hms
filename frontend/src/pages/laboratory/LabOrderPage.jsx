import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge }   from '@components/common/Badge';
import Modal             from '@components/common/Modal';
import LoadingSpinner    from '@components/common/LoadingSpinner';
import {
  ArrowLeftIcon, BeakerIcon, CheckCircleIcon,
  DocumentTextIcon, UserIcon, ClockIcon, PrinterIcon,
} from '@heroicons/react/24/outline';
import { laboratoryAPI } from '@api/laboratory.api';
import { printLabReport } from '@utils/printLabReport';
import toast from 'react-hot-toast';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

/**
 * Auto-detect if a result is abnormal based on normal range string.
 * Supports formats: "70-100", "< 200", "> 60", "3.5–5.0", "< 6 mg/L"
 */
function detectAbnormal(result, normalRange) {
  if (!result || !normalRange) return false;
  const val = parseFloat(result);
  if (isNaN(val)) return false; // non-numeric result — can't auto-detect

  const range = normalRange.trim();

  // Format: "< 200" or "< 6 mg/L"
  const ltMatch = range.match(/^<\s*([\d.]+)/);
  if (ltMatch) return val >= parseFloat(ltMatch[1]);

  // Format: "> 60"
  const gtMatch = range.match(/^>\s*([\d.]+)/);
  if (gtMatch) return val <= parseFloat(gtMatch[1]);

  // Format: "70-100" or "3.5–5.0" or "70 - 100"
  const rangeMatch = range.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (rangeMatch) {
    const low  = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return val < low || val > high;
  }

  return false;
}

export default function LabOrderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [saving,  setSaving]  = useState(false);

  const fetchOrder = async () => {
    if (!id || id === 'undefined') {
      navigate('/laboratory');
      return;
    }
    setLoading(true);
    try {
      const res = await laboratoryAPI.getById(id);
      const o   = res.data?.data;
      setOrder(o);
      // pre-fill result form rows
      setResults(
        (o.items || []).map(item => {
          const result      = item.result      || '';
          const normalRange = item.normalRange || item.test?.normalRange || '';
          const isAbnormal  = item.result
            ? (!!item.isAbnormal || detectAbnormal(result, normalRange))
            : false;
          return {
            itemId:      item.id,
            testName:    item.test?.testName,
            result,
            unit:        item.unit        || item.test?.unit        || '',
            normalRange,
            isAbnormal,
            remarks:     item.remarks     || '',
          };
        })
      );
    } catch {
      toast.error('Failed to load lab order');
      navigate('/laboratory');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleEnterResults = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await laboratoryAPI.enterResults(id, results);
      toast.success('Results saved successfully');
      setShowResults(false);
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save results');
    } finally { setSaving(false); }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve these lab results?')) return;
    try {
      await laboratoryAPI.approve(id);
      toast.success('Results approved');
      fetchOrder();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to approve');
    }
  };

  const updateResult = (index, field, value) => {
    setResults(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, [field]: value };

      // Auto-detect abnormal when result or normalRange changes
      if (field === 'result' || field === 'normalRange') {
        const result      = field === 'result'      ? value : r.result;
        const normalRange = field === 'normalRange' ? value : r.normalRange;
        updated.isAbnormal = detectAbnormal(result, normalRange);
      }

      return updated;
    }));
  };

  if (loading) return <LoadingSpinner text="Loading lab order..." />;
  if (!order)  return null;

  const p         = order.patient;
  const canEnter  = ['PENDING', 'IN_PROGRESS'].includes(order.status);
  const canApprove= order.status === 'COMPLETED';

  const urgencyClass = order.urgency === 'STAT'
    ? 'bg-red-100 text-red-700'
    : order.urgency === 'URGENT'
      ? 'bg-orange-100 text-orange-700'
      : 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="page-title">{order.orderNo}</h1>
            <p className="page-subtitle">
              {new Date(order.createdAt).toLocaleDateString()} ·{' '}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyClass}`}>
                {order.urgency}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button
            onClick={() => printLabReport(order)}
            className="btn-secondary"
            title="Print Lab Report"
          >
            <PrinterIcon className="w-4 h-4" /> Print Report
          </button>
          {canEnter && (
            <button onClick={() => setShowResults(true)} className="btn-primary">
              <BeakerIcon className="w-4 h-4" /> Enter Results
            </button>
          )}
          {canApprove && (
            <button onClick={handleApprove} className="btn-success">
              <CheckCircleIcon className="w-4 h-4" /> Approve
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Order Info ── */}
        <div className="space-y-5">
          {/* Patient */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary-600" /> Patient
            </h3>
            <div className="space-y-2">
              <InfoRow label="Name"        value={`${p?.firstName} ${p?.lastName}`} />
              <InfoRow label="Patient ID"  value={p?.patientId} />
              <InfoRow label="Phone"       value={p?.phone} />
              <InfoRow label="Blood Group" value={p?.bloodGroup?.replace('_',' ')} />
            </div>
            <Link to={`/patients/${p?.id}`}
              className="text-xs text-primary-600 hover:underline font-medium">
              View patient record →
            </Link>
          </div>

          {/* Order details */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-primary-600" /> Order Details
            </h3>
            <div className="space-y-2">
              <InfoRow label="Order No"    value={order.orderNo} />
              <InfoRow label="Date"        value={new Date(order.createdAt).toLocaleString()} />
              <InfoRow label="Doctor"      value={order.doctor ? `Dr. ${order.doctor.firstName} ${order.doctor.lastName}` : null} />
              <InfoRow label="Technician"  value={order.technician ? `${order.technician.firstName} ${order.technician.lastName}` : null} />
              <InfoRow label="Sample Type" value={order.sampleType} />
              <InfoRow label="Clinical Info" value={order.clinicalInfo} />
            </div>
            {order.visit && (
              <Link to={`/opd/${order.visit.id}`}
                className="text-xs text-primary-600 hover:underline font-medium">
                Visit: {order.visit.visitNo} →
              </Link>
            )}
          </div>

          {/* Timestamps */}
          {(order.completedAt || order.approvedAt) && (
            <div className="card p-5 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-primary-600" /> Timeline
              </h3>
              <InfoRow label="Ordered"   value={new Date(order.createdAt).toLocaleString()} />
              {order.completedAt && (
                <InfoRow label="Completed" value={new Date(order.completedAt).toLocaleString()} />
              )}
              {order.approvedAt && (
                <InfoRow label="Approved" value={new Date(order.approvedAt).toLocaleString()} />
              )}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BeakerIcon className="w-4 h-4 text-primary-600" />
                Test Results ({order.items?.length})
              </h3>
              {canEnter && (
                <button onClick={() => setShowResults(true)}
                  className="text-xs text-primary-600 hover:underline font-medium">
                  Enter / Update Results
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Unit</th>
                    <th>Normal Range</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {order.items?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        No tests in this order
                      </td>
                    </tr>
                  )}
                  {order.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.test?.testName}</div>
                        <div className="text-xs text-gray-400">{item.test?.testCode}</div>
                      </td>
                      <td>
                        {item.result ? (
                          <span className={`font-semibold ${!!item.isAbnormal ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>
                            {item.result}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Pending</span>
                        )}
                      </td>
                      <td className="text-xs text-gray-500">{item.unit || item.test?.unit || '—'}</td>
                      <td className="text-xs text-gray-500">{item.normalRange || item.test?.normalRange || '—'}</td>
                      <td className="text-xs text-gray-500 max-w-[150px] truncate">
                        {item.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Enter Results Modal ── */}
      <Modal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        title="Enter Lab Results"
        size="xl"
        footer={
          <>
            <button onClick={() => setShowResults(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleEnterResults} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Results'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEnterResults} className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Patient: <strong className="text-gray-900 dark:text-white">
              {p?.firstName} {p?.lastName}
            </strong> · Order: <strong className="text-gray-900 dark:text-white">{order.orderNo}</strong>
          </div>

          {results.map((row, i) => (
            <div key={row.itemId} className="card p-4 space-y-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.testName}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Result *</label>
                  <input type="text" className="input" placeholder="e.g. 5.2"
                    value={row.result}
                    onChange={e => updateResult(i, 'result', e.target.value)} />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <input type="text" className="input" placeholder="e.g. mg/dL"
                    value={row.unit}
                    onChange={e => updateResult(i, 'unit', e.target.value)} />
                </div>
                <div>
                  <label className="label">Normal Range</label>
                  <input type="text" className="input" placeholder="e.g. 70-100 mg/dL"
                    value={row.normalRange}
                    onChange={e => updateResult(i, 'normalRange', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Remarks</label>
                <input type="text" className="input" placeholder="Optional remarks..."
                  value={row.remarks}
                  onChange={e => updateResult(i, 'remarks', e.target.value)} />
              </div>
            </div>
          ))}
        </form>
      </Modal>
    </div>
  );
}
