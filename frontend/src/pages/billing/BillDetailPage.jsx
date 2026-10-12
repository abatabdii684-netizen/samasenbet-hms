import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge }   from '@components/common/Badge';
import Modal             from '@components/common/Modal';
import LoadingSpinner    from '@components/common/LoadingSpinner';
import {
  ArrowLeftIcon, BanknotesIcon, PlusIcon,
  CheckCircleIcon, TrashIcon, UserIcon,
} from '@heroicons/react/24/outline';
import { billingAPI }  from '@api/billing.api';
import { paymentsAPI } from '@api/payments.api';
import toast from 'react-hot-toast';

const fmt = (n) => `ETB ${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_METHODS = ['CASH','CARD','BANK_TRANSFER','MOBILE_MONEY','INSURANCE','CHEQUE'];

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="text-xs font-medium text-gray-500 min-w-[130px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

export default function BillDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [bill,    setBill]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [showItem,setShowItem]= useState(false);
  const [saving,  setSaving]  = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', reference: '', notes: '' });
  const [itemForm,setItemForm]= useState({ description: '', quantity: 1, unitPrice: '', discount: 0 });

  const fetchBill = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getById(id);
      setBill(res.data?.data);
    } catch {
      toast.error('Failed to load bill');
      navigate('/billing');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBill(); }, [id]);

  // ── finalize ──────────────────────────────────────────────────────
  const handleFinalize = async () => {
    if (!window.confirm('Finalize this bill? No more items can be added after finalization.')) return;
    try {
      await billingAPI.finalize(id);
      toast.success('Bill finalized');
      fetchBill();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to finalize');
    }
  };

  // ── add item ──────────────────────────────────────────────────────
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.description || !itemForm.unitPrice) {
      toast.error('Description and unit price required'); return;
    }
    setSaving(true);
    try {
      await billingAPI.addItem(id, itemForm);
      toast.success('Item added');
      setShowItem(false);
      setItemForm({ description: '', quantity: 1, unitPrice: '', discount: 0 });
      fetchBill();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add item');
    } finally { setSaving(false); }
  };

  // ── remove item ───────────────────────────────────────────────────
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this item?')) return;
    try {
      await billingAPI.removeItem(id, itemId);
      toast.success('Item removed');
      fetchBill();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to remove item');
    }
  };

  // ── receive payment ───────────────────────────────────────────────
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    setSaving(true);
    try {
      await paymentsAPI.create({ ...payForm, billId: id });
      toast.success('Payment recorded successfully');
      setShowPay(false);
      setPayForm({ amount: '', method: 'CASH', reference: '', notes: '' });
      fetchBill();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to record payment');
    } finally { setSaving(false); }
  };

  // ── refund ────────────────────────────────────────────────────────
  const handleRefund = async (paymentId) => {
    const reason = window.prompt('Reason for refund:');
    if (reason === null) return;
    try {
      await paymentsAPI.refund(paymentId, reason);
      toast.success('Payment refunded');
      fetchBill();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to refund');
    }
  };

  if (loading) return <LoadingSpinner text="Loading bill..." />;
  if (!bill)   return null;

  const p         = bill.patient;
  const isDraft   = bill.status === 'DRAFT';
  const canPay    = ['FINALIZED','PARTIALLY_PAID'].includes(bill.status);
  const isPaid    = bill.status === 'PAID';

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="page-title">{bill.billNo}</h1>
            <p className="page-subtitle">{new Date(bill.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={bill.status} />
          {isDraft && (
            <>
              <button onClick={() => setShowItem(true)} className="btn-secondary">
                <PlusIcon className="w-4 h-4" /> Add Item
              </button>
              <button onClick={handleFinalize} className="btn-primary">
                <CheckCircleIcon className="w-4 h-4" /> Finalize
              </button>
            </>
          )}
          {canPay && (
            <button onClick={() => setShowPay(true)} className="btn-success">
              <BanknotesIcon className="w-4 h-4" /> Receive Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Patient & Bill Info */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary-600" /> Patient
            </h3>
            <InfoRow label="Name"       value={`${p?.firstName} ${p?.lastName}`} />
            <InfoRow label="Patient ID" value={p?.patientId} />
            <InfoRow label="Phone"      value={p?.phone} />
            <Link to={`/patients/${p?.id}`}
              className="text-xs text-primary-600 hover:underline font-medium">
              View patient record →
            </Link>
          </div>

          {bill.visit && (
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Related Visit</p>
              <Link to={`/opd/${bill.visit.id}`}
                className="font-medium text-primary-600 hover:underline text-sm">
                {bill.visit.visitNo}
              </Link>
              {bill.visit.diagnosis && (
                <p className="text-xs text-gray-400 mt-1">{bill.visit.diagnosis}</p>
              )}
            </div>
          )}

          {/* Amount summary */}
          <div className="card p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{fmt(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-red-500">-{fmt(bill.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{fmt(bill.tax)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span>{fmt(bill.total)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Paid</span>
                <span>{fmt(bill.paidAmount)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base ${
                parseFloat(bill.dueAmount) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                <span>Due</span>
                <span>{fmt(bill.dueAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Items + Payments */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Bill Items ({bill.items?.length})
              </h3>
              {isDraft && (
                <button onClick={() => setShowItem(true)}
                  className="text-xs text-primary-600 hover:underline font-medium">
                  + Add Item
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th><th>Qty</th>
                    <th>Unit Price</th><th>Discount</th><th>Total</th>
                    {isDraft && <th></th>}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {bill.items?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No items yet</td>
                    </tr>
                  )}
                  {bill.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.description}</div>
                        {item.serviceType && (
                          <div className="text-xs text-gray-400">{item.serviceType.name}</div>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{fmt(item.unitPrice)}</td>
                      <td className="text-red-500">{parseFloat(item.discount) > 0 ? `-${fmt(item.discount)}` : '—'}</td>
                      <td className="font-semibold">{fmt(item.total)}</td>
                      {isDraft && (
                        <td>
                          <button onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 inline-flex">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Payments ({bill.payments?.length})
              </h3>
              {canPay && (
                <button onClick={() => setShowPay(true)}
                  className="text-xs text-primary-600 hover:underline font-medium">
                  + Receive Payment
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Payment No</th><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th></th></tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {bill.payments?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">No payments recorded</td>
                    </tr>
                  )}
                  {bill.payments?.map(pay => (
                    <tr key={pay.id}>
                      <td className="font-mono text-xs font-semibold">{pay.paymentNo}</td>
                      <td className="text-sm">{new Date(pay.paidAt).toLocaleString()}</td>
                      <td className="font-semibold text-green-600">{fmt(pay.amount)}</td>
                      <td><span className="badge badge-blue">{pay.method}</span></td>
                      <td className="text-sm text-gray-500">{pay.reference || '—'}</td>
                      <td><StatusBadge status={pay.status} /></td>
                      <td>
                        {pay.status === 'COMPLETED' && !isPaid && (
                          <button onClick={() => handleRefund(pay.id)}
                            className="text-xs text-red-500 hover:underline">
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Payment Modal */}
      <Modal isOpen={showPay} onClose={() => setShowPay(false)}
        title="Receive Payment" size="sm"
        footer={
          <>
            <button onClick={() => setShowPay(false)} className="btn-secondary">Cancel</button>
            <button onClick={handlePay} disabled={saving} className="btn-success">
              {saving ? 'Processing...' : 'Record Payment'}
            </button>
          </>
        }
      >
        <form onSubmit={handlePay} className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
            Due amount: <strong>{fmt(bill.dueAmount)}</strong>
          </div>
          <div>
            <label className="label">Amount (ETB) *</label>
            <input type="number" step="0.01" className="input"
              placeholder={`Max: ${parseFloat(bill.dueAmount).toFixed(2)}`}
              max={bill.dueAmount}
              value={payForm.amount}
              onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
              required />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={payForm.method}
              onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reference / Receipt No</label>
            <input type="text" className="input" placeholder="Optional..."
              value={payForm.reference}
              onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input type="text" className="input" placeholder="Optional..."
              value={payForm.notes}
              onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={showItem} onClose={() => setShowItem(false)}
        title="Add Bill Item" size="sm"
        footer={
          <>
            <button onClick={() => setShowItem(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddItem} disabled={saving} className="btn-primary">
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddItem} className="space-y-3">
          <div>
            <label className="label">Description *</label>
            <input type="text" className="input" placeholder="e.g. OPD Consultation"
              value={itemForm.description}
              onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
              required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" min="1"
                value={itemForm.quantity}
                onChange={e => setItemForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Unit Price (ETB) *</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={itemForm.unitPrice}
                onChange={e => setItemForm(f => ({ ...f, unitPrice: e.target.value }))}
                required />
            </div>
          </div>
          <div>
            <label className="label">Discount (ETB)</label>
            <input type="number" step="0.01" className="input" placeholder="0.00"
              value={itemForm.discount}
              onChange={e => setItemForm(f => ({ ...f, discount: e.target.value }))} />
          </div>
          {itemForm.unitPrice && (
            <div className="text-right text-sm font-semibold text-primary-600">
              Line Total: {fmt((parseFloat(itemForm.unitPrice || 0) * parseInt(itemForm.quantity || 1)) - parseFloat(itemForm.discount || 0))}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
