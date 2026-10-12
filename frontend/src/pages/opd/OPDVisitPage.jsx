import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@components/common/Badge';
import Modal           from '@components/common/Modal';
import LoadingSpinner  from '@components/common/LoadingSpinner';
import {
  ArrowLeftIcon, UserIcon, HeartIcon, BeakerIcon,
  ShoppingBagIcon, BuildingOfficeIcon, DocumentTextIcon,
  PencilSquareIcon, CheckCircleIcon, PlusIcon, TrashIcon,
  XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon,
  PhotoIcon, PrinterIcon,
} from '@heroicons/react/24/outline';
import { opdAPI }        from '@api/opd.api';
import { pharmacyAPI }   from '@api/pharmacy.api';
import { laboratoryAPI } from '@api/laboratory.api';
import api               from '@api/axios';
import { printOPDOrderSheet } from '@utils/printOPDOrderSheet';
import toast from 'react-hot-toast';

// ── helpers ───────────────────────────────────────────────────────
const calcAge = (dob) => dob
  ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
  : '—';

function SectionCard({ icon: Icon, title, children, action }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary-600" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="text-xs font-medium text-gray-500 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

function NoteBlock({ label, value }) {
  if (!value) return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-400 italic">Not recorded</p>
    </div>
  );
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

const EMPTY_DX = {
  chiefComplaint:'', presentIllness:'', pastHistory:'', physicalExam:'',
  diagnosis:'', icdCode:'', treatment:'',
  followUpDate:'', referredTo:'', status:'IN_PROGRESS',
};

const EMPTY_DC = { dischargeNote:'' };

// ── Prescription Detail Component ────────────────────────────────
function PrescriptionDetail({ rx }) {
  const [expanded, setExpanded] = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const { pharmacyAPI } = await import('@api/pharmacy.api');
        const res = await pharmacyAPI.getById(rx.id);
        setDetail(res.data?.data);
      } catch { /* fallback to rx data */ }
      finally { setLoading(false); }
    }
    setExpanded(e => !e);
  };

  // Auto-expand dispensed prescriptions
  React.useEffect(() => {
    if (rx.status === 'DISPENSED' && !detail) {
      import('@api/pharmacy.api').then(({ pharmacyAPI }) =>
        pharmacyAPI.getById(rx.id)
          .then(res => setDetail(res.data?.data))
          .catch(() => {})
      );
      setExpanded(true);
    }
  }, [rx.id, rx.status]);

  const data  = detail || rx;
  const items = data.items || [];

  const statusColor = rx.status === 'DISPENSED'
    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
    : rx.status === 'PARTIALLY_DISPENSED'
      ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      : rx.status === 'CANCELLED'
        ? 'text-red-600 bg-red-100 dark:bg-red-900/30'
        : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button onClick={toggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <ShoppingBagIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{rx.prescriptionNo}</p>
            <p className="text-xs text-gray-400">
              {items.length || rx.items?.length || 0} drug(s) · {new Date(rx.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
            {rx.status?.replace(/_/g, ' ')}
          </span>
          {loading
            ? <span className="text-xs text-gray-400">Loading...</span>
            : expanded
              ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
              : <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Doctor</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {data.doctor ? `Dr. ${data.doctor.firstName} ${data.doctor.lastName}` : '—'}
              </p>
            </div>
            {data.dispensedAt && (
              <div>
                <p className="text-gray-500">Dispensed</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(data.dispensedAt).toLocaleString()}
                </p>
              </div>
            )}
            {data.pharmacist && (
              <div>
                <p className="text-gray-500">Pharmacist</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {data.pharmacist.firstName} {data.pharmacist.lastName}
                </p>
              </div>
            )}
          </div>

          {/* Drug items table */}
          {items.length > 0 && (
            <div className="overflow-x-auto rounded border border-gray-100 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Drug</th>
                    <th className="text-left px-3 py-2 font-medium">Dosage</th>
                    <th className="text-left px-3 py-2 font-medium">Frequency</th>
                    <th className="text-left px-3 py-2 font-medium">Duration</th>
                    <th className="text-left px-3 py-2 font-medium">Qty</th>
                    <th className="text-left px-3 py-2 font-medium">Dispensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.drug?.genericName}
                        </p>
                        <p className="text-gray-400">
                          {item.drug?.brandName} · {item.drug?.strength}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.dosage}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.frequency}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.duration}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="px-3 py-2">
                        {item.dispensedQty > 0
                          ? <span className="font-semibold text-green-600">{item.dispensedQty}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded p-2">
                {data.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lab Order Result Component ────────────────────────────────────
function LabOrderResult({ order }) {
  const [expanded, setExpanded] = useState(order.status === 'APPROVED'); // auto-expand approved
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const toggle = async () => {
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const res = await laboratoryAPI.getById(order.id);
        setDetail(res.data?.data);
      } catch { /* use order data fallback */ }
      finally { setLoading(false); }
    }
    setExpanded(e => !e);
  };

  // Auto-load detail for approved orders on mount
  React.useEffect(() => {
    if (order.status === 'APPROVED' && !detail) {
      laboratoryAPI.getById(order.id)
        .then(res => setDetail(res.data?.data))
        .catch(() => {});
    }
  }, [order.id, order.status]);

  const items = detail?.items || order.items || [];
  const hasResults = items.some(i => i.result);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header row */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <BeakerIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{order.orderNo}</p>
            <p className="text-xs text-gray-400">
              {items.length} test(s) · {new Date(order.createdAt).toLocaleDateString()}
              {order.urgency && order.urgency !== 'ROUTINE' && (
                <span className="ml-2 text-orange-500 font-semibold">{order.urgency}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.status === 'APPROVED' && (
            <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full animate-pulse">
              ✓ Results Ready
            </span>
          )}
          {order.status === 'COMPLETED' && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
              Awaiting Approval
            </span>
          )}
          {!['APPROVED','COMPLETED'].includes(order.status) && (
            <StatusBadge status={order.status} />
          )}
          {loading
            ? <span className="text-xs text-gray-400">Loading...</span>
            : expanded
              ? <ChevronUpIcon className="w-4 h-4 text-gray-400" />
              : <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded results */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          {!hasResults ? (
            <p className="text-sm text-gray-400 italic text-center py-3">
              Results not yet entered by laboratory.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">Test</th>
                    <th className="text-left px-3 py-2 font-medium">Result</th>
                    <th className="text-left px-3 py-2 font-medium">Unit</th>
                    <th className="text-left px-3 py-2 font-medium">Normal Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(item => (
                    <tr key={item.id} className={!!item.isAbnormal ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900 dark:text-white">{item.test?.testName}</p>
                        <p className="text-xs text-gray-400">{item.test?.testCode}</p>
                      </td>
                      <td className={`px-3 py-2 font-semibold ${!!item.isAbnormal ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {item.result || '—'}
                        {!!item.isAbnormal && <span className="ml-1 text-xs text-red-500">⚠</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{item.unit || item.test?.unit || '—'}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{item.normalRange || item.test?.normalRange || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.some(i => i.remarks) && (
                <p className="text-xs text-gray-500 mt-2 px-1">Remarks: {items.find(i=>i.remarks)?.remarks}</p>
              )}
            </div>
          )}
          <div className="flex justify-end mt-2">
            <Link to={`/laboratory/${order.id}`}
              className="text-xs text-primary-600 hover:underline font-medium">
              Open in Lab →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────
export default function OPDVisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit,    setVisit]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showDx,   setShowDx]   = useState(false);
  const [showDc,   setShowDc]   = useState(false);
  const [showRx,   setShowRx]   = useState(false);
  const [dxForm,   setDxForm]   = useState(EMPTY_DX);
  const [dcForm,   setDcForm]   = useState(EMPTY_DC);
  const [saving,   setSaving]   = useState(false);

  // Prescription state
  const [allDrugs,  setAllDrugs]  = useState([]);
  const [rxItems,   setRxItems]   = useState([]);
  const [rxNotes,   setRxNotes]   = useState('');
  const [drugSearch,setDrugSearch]= useState('');
  const [rxSaving,  setRxSaving]  = useState(false);

  // Lab order state
  const [showLab,       setShowLab]       = useState(false);
  const [allTests,      setAllTests]      = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [labUrgency,    setLabUrgency]    = useState('ROUTINE');
  const [labSample,     setLabSample]     = useState('');
  const [labClinical,   setLabClinical]   = useState('');
  const [labTestSearch, setLabTestSearch] = useState('');
  const [labSaving,     setLabSaving]     = useState(false);

  // Imaging state
  const [showImaging,      setShowImaging]      = useState(false);
  const [imagingSelected,  setImagingSelected]  = useState([]);
  const [imagingFindings,  setImagingFindings]  = useState('');
  const [imagingUrgency,   setImagingUrgency]   = useState('ROUTINE');
  const [imagingSaving,    setImagingSaving]    = useState(false);
  const [imagingOrders,    setImagingOrders]    = useState([]); // stored locally per visit

  const fetchVisit = async () => {
    setLoading(true);
    try {
      const res = await opdAPI.getById(id);
      const v   = res.data?.data;
      setVisit(v);
      // pre-fill diagnosis form
      setDxForm({
        chiefComplaint: v.chiefComplaint || '',
        presentIllness: v.presentIllness || '',
        pastHistory:    v.pastHistory    || '',
        physicalExam:   v.physicalExam   || '',
        diagnosis:      v.diagnosis      || '',
        icdCode:        v.icdCode        || '',
        treatment:      v.treatment      || '',
        followUpDate:   v.followUpDate   ? v.followUpDate.split('T')[0] : '',
        referredTo:     v.referredTo     || '',
        status:         v.status         || 'IN_PROGRESS',
      });
    } catch {
      toast.error('Failed to load visit');
      navigate('/opd');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVisit(); }, [id]);

  // ── save diagnosis ────────────────────────────────────────────
  const handleSaveDx = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await opdAPI.diagnose(id, dxForm);
      toast.success('Diagnosis saved');
      setShowDx(false);
      fetchVisit();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  // ── discharge ─────────────────────────────────────────────────
  const handleDischarge = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await opdAPI.discharge(id, dcForm);
      toast.success('Patient discharged');
      setShowDc(false);
      fetchVisit();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to discharge');
    } finally { setSaving(false); }
  };

  // ── open prescription modal ───────────────────────────────────
  const openRxModal = async () => {
    setRxItems([]);
    setRxNotes('');
    setDrugSearch('');
    setShowRx(true);
    try {
      const res = await pharmacyAPI.getAllDrugs({ limit: 500 });
      setAllDrugs(res.data?.data ?? []);
    } catch { toast.error('Failed to load drugs'); }
  };

  const addRxItem = (drug) => {
    if (rxItems.find(i => i.drugId === drug.id)) return; // already added
    setRxItems(prev => [...prev, {
      drugId:    drug.id,
      drugName:  drug.genericName,
      strength:  drug.strength,
      form:      drug.form,
      dosage:    '',
      frequency: '',
      duration:  '',
      quantity:  1,
      notes:     '',
    }]);
  };

  const removeRxItem = (drugId) => {
    setRxItems(prev => prev.filter(i => i.drugId !== drugId));
  };

  const updateRxItem = (drugId, field, value) => {
    setRxItems(prev => prev.map(i =>
      i.drugId === drugId ? { ...i, [field]: value } : i
    ));
  };

  const handleSaveRx = async (e) => {
    e.preventDefault();
    if (rxItems.length === 0) { toast.error('Add at least one drug'); return; }
    const invalid = rxItems.find(i => !i.dosage || !i.frequency || !i.duration);
    if (invalid) { toast.error(`Fill in dosage, frequency and duration for ${invalid.drugName}`); return; }

    setRxSaving(true);
    try {
      await api.post('/pharmacy/prescriptions', {
        visitId:   parseInt(id),
        patientId: visit.patient?.id,
        notes:     rxNotes || undefined,
        items:     rxItems.map(i => ({
          drugId:    i.drugId,
          dosage:    i.dosage,
          frequency: i.frequency,
          duration:  i.duration,
          quantity:  parseInt(i.quantity) || 1,
          notes:     i.notes || undefined,
        })),
      });
      toast.success('Prescription written successfully');
      setShowRx(false);
      fetchVisit();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to write prescription');
    } finally { setRxSaving(false); }
  };

  const filteredDrugs = allDrugs.filter(d =>
    !drugSearch ||
    d.genericName.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.brandName?.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.drugCode.toLowerCase().includes(drugSearch.toLowerCase())
  ).slice(0, 30);

  // ── lab order handlers ────────────────────────────────────────
  const openLabModal = async () => {
    setSelectedTests([]);
    setLabUrgency('ROUTINE');
    setLabSample('');
    setLabClinical('');
    setLabTestSearch('');
    setShowLab(true);
    try {
      const res = await laboratoryAPI.getAllTests({ page: 1, limit: 500 });
      setAllTests(res.data?.data ?? []);
    } catch { toast.error('Failed to load test catalog'); }
  };

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.find(t => t.id === test.id)
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const handleSaveLab = async () => {
    if (selectedTests.length === 0) { toast.error('Select at least one test'); return; }
    setLabSaving(true);
    try {
      await laboratoryAPI.create({
        patientId:   visit.patient?.id,
        visitId:     parseInt(id),   // ← link directly to this visit
        testIds:     selectedTests.map(t => t.id),
        urgency:     labUrgency,
        sampleType:  labSample    || undefined,
        clinicalInfo:labClinical  || undefined,
      });
      toast.success('Lab order created and linked to this visit');
      setShowLab(false);
      fetchVisit();  // reload visit to show new lab orders
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create lab order');
    } finally { setLabSaving(false); }
  };

  const filteredTests = allTests.filter(t =>
    !labTestSearch ||
    t.testName.toLowerCase().includes(labTestSearch.toLowerCase()) ||
    t.testCode.toLowerCase().includes(labTestSearch.toLowerCase())
  );

  // ── imaging constants & handlers ─────────────────────────────
  const IMAGING_TYPES = [
    // X-RAY
    { id: 'xray-chest',     label: 'Chest',               group: 'X-RAY' },
    { id: 'xray-abdomen',   label: 'Abdomen',              group: 'X-RAY' },
    { id: 'xray-skull',     label: 'Skull',                group: 'X-RAY' },
    { id: 'xray-spine',     label: 'Spine',                group: 'X-RAY' },
    { id: 'xray-pelvis',    label: 'Pelvis',               group: 'X-RAY' },
    { id: 'xray-extremity', label: 'Extremity',            group: 'X-RAY' },
    { id: 'xray-kub',       label: 'KUB',                  group: 'X-RAY' },
    // ULTRASOUND
    { id: 'us-abdomen',     label: 'Abdomen',              group: 'ULTRASOUND' },
    { id: 'us-pelvis',      label: 'Pelvis',               group: 'ULTRASOUND' },
    { id: 'us-obstetric',   label: 'Obstetric',            group: 'ULTRASOUND' },
    { id: 'us-thyroid',     label: 'Thyroid',              group: 'ULTRASOUND' },
    { id: 'us-breast',      label: 'Breast',               group: 'ULTRASOUND' },
    { id: 'us-scrotum',     label: 'Scrotum',              group: 'ULTRASOUND' },
    { id: 'us-msk',         label: 'Musculoskeletal',      group: 'ULTRASOUND' },
    // CT SCAN
    { id: 'ct-brain',       label: 'Brain',                group: 'CT SCAN' },
    { id: 'ct-chest',       label: 'Chest',                group: 'CT SCAN' },
    { id: 'ct-abdomen',     label: 'Abdomen & Pelvis',     group: 'CT SCAN' },
    { id: 'ct-spine',       label: 'Spine',                group: 'CT SCAN' },
    // MRI
    { id: 'mri-brain',      label: 'Brain',                group: 'MRI' },
    { id: 'mri-spine',      label: 'Spine',                group: 'MRI' },
    { id: 'mri-joint',      label: 'Joint',                group: 'MRI' },
    // OTHER
    { id: 'echo',           label: 'Echocardiogram',       group: 'OTHER' },
    { id: 'ecg',            label: 'ECG',                  group: 'OTHER' },
    { id: 'mammogram',      label: 'Mammogram',            group: 'OTHER' },
  ];

  const openImagingModal = () => {
    setImagingSelected([]);
    setImagingFindings('');
    setImagingUrgency('ROUTINE');
    setShowImaging(true);
  };

  const toggleImaging = (item) => {
    setImagingSelected(prev =>
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleSaveImaging = () => {
    if (imagingSelected.length === 0) {
      toast.error('Select at least one imaging study');
      return;
    }
    setImagingSaving(true);
    const newOrder = {
      id:        Date.now(),
      studies:   imagingSelected,
      urgency:   imagingUrgency,
      findings:  imagingFindings || '',
      orderedAt: new Date().toISOString(),
    };
    setImagingOrders(prev => [newOrder, ...prev]);
    setShowImaging(false);
    setImagingSaving(false);
    toast.success(`${imagingSelected.length} imaging study(s) ordered`);
  };

  if (loading) return <LoadingSpinner text="Loading visit..." />;
  if (!visit)  return null;

  const p      = visit.patient;
  const doctor = visit.doctor;
  const triage = visit.triage;
  const isOpen = !['COMPLETED','REFERRED'].includes(visit.status);

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
            <h1 className="page-title">{visit.visitNo}</h1>
            <p className="page-subtitle">
              {new Date(visit.visitDate).toLocaleDateString()} ·{' '}
              {visit.clinicType?.replace(/_/g,' ')} ·{' '}
              {visit.patientType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={visit.status} />
          <button
            onClick={() => printOPDOrderSheet(visit)}
            className="btn-secondary"
            title="Print Order Sheet"
          >
            <PrinterIcon className="w-4 h-4" /> Order Sheet
          </button>
          {isOpen && (
            <>
              <button onClick={() => setShowDx(true)} className="btn-secondary">
                <PencilSquareIcon className="w-4 h-4" /> Diagnose
              </button>
              <button onClick={openLabModal} className="btn-secondary">
                <BeakerIcon className="w-4 h-4" /> Order Lab
              </button>
              <button onClick={openImagingModal} className="btn-secondary">
                <PhotoIcon className="w-4 h-4" /> Imaging
              </button>
              <button onClick={openRxModal} className="btn-secondary">
                <ShoppingBagIcon className="w-4 h-4" /> Prescribe
              </button>
              <button onClick={() => setShowDc(true)} className="btn-success">
                <CheckCircleIcon className="w-4 h-4" /> Discharge
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Patient',    value: `${p?.firstName} ${p?.lastName}` },
          { label: 'Age / Sex',  value: `${calcAge(p?.dateOfBirth)} yrs / ${p?.gender || '—'}` },
          { label: 'Doctor',     value: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—' },
          { label: 'Triage',     value: triage ? 'Completed' : 'Pending' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Patient Info ── */}
        <SectionCard icon={UserIcon} title="Patient Information">
          <div className="space-y-2">
            <InfoRow label="Full Name"   value={`${p?.firstName} ${p?.lastName}`} />
            <InfoRow label="Patient ID"  value={p?.patientId} />
            <InfoRow label="Phone"       value={p?.phone} />
            <InfoRow label="Blood Group" value={p?.bloodGroup?.replace('_',' ')} />
            <InfoRow label="Allergies"   value={p?.allergies} />
          </div>
          <Link to={`/patients/${p?.id}`}
            className="text-xs text-primary-600 hover:underline font-medium">
            View full patient record →
          </Link>
        </SectionCard>

        {/* ── Triage Vitals ── */}
        <SectionCard icon={HeartIcon} title="Triage / Vitals">
          {triage ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Temp',      value: triage.temperature,        unit: '°C'   },
                { label: 'BP',        value: triage.bloodPressureSystolic
                  ? `${triage.bloodPressureSystolic}/${triage.bloodPressureDiastolic}` : null, unit: 'mmHg' },
                { label: 'Pulse',     value: triage.pulseRate,           unit: 'bpm'  },
                { label: 'SpO₂',      value: triage.oxygenSaturation,    unit: '%'    },
                { label: 'Weight',    value: triage.weight,              unit: 'kg'   },
                { label: 'BMI',       value: triage.bmi,                 unit: ''     },
              ].map(v => (
                <div key={v.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{v.label}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {v.value ?? '—'} {v.value && v.unit ? <span className="text-xs font-normal text-gray-400">{v.unit}</span> : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Triage not yet recorded for this visit.</p>
          )}
          {triage?.chiefComplaint && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Chief Complaint</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                {triage.chiefComplaint}
              </p>
            </div>
          )}
        </SectionCard>

        {/* ── Clinical Notes (full width) ── */}
        <div className="lg:col-span-2">
          <SectionCard icon={DocumentTextIcon} title="Clinical Notes & Diagnosis"
            action={isOpen && (
              <button onClick={() => setShowDx(true)}
                className="text-xs text-primary-600 hover:underline font-medium">
                Edit
              </button>
            )}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NoteBlock label="Chief Complaint"            value={visit.chiefComplaint} />
              <NoteBlock label="History of Present Illness" value={visit.presentIllness} />
              <NoteBlock label="Past Medical History"       value={visit.pastHistory}    />
              <NoteBlock label="Physical Examination"       value={visit.physicalExam}   />
              <div className="space-y-2">
                <NoteBlock label="Diagnosis"   value={visit.diagnosis}  />
                <InfoRow   label="ICD Code"    value={visit.icdCode}    />
              </div>
              <NoteBlock label="Treatment Plan" value={visit.treatment} />
              <div className="space-y-2">
                <InfoRow label="Follow-up Date" value={visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString() : null} />
                <InfoRow label="Referred To"    value={visit.referredTo} />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Lab Orders ── */}
        <SectionCard icon={BeakerIcon} title={`Lab Orders (${visit.labOrders?.length ?? 0})`}
          action={isOpen && (
            <button onClick={openLabModal}
              className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              <PlusIcon className="w-3.5 h-3.5" /> Order Lab
            </button>
          )}
        >
          {visit.labOrders?.length === 0 ? (
            <div className="text-center py-4">
              <BeakerIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No lab orders yet</p>
              {isOpen && (
                <button onClick={openLabModal}
                  className="mt-2 text-xs text-primary-600 hover:underline font-medium">
                  + Order lab tests for this visit
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visit.labOrders?.map(order => (
                <LabOrderResult key={order.id} order={order} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Prescriptions ── */}
        <SectionCard icon={ShoppingBagIcon} title={`Prescriptions (${visit.prescriptions?.length ?? 0})`}
          action={isOpen && (
            <button onClick={openRxModal}
              className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              <PlusIcon className="w-3.5 h-3.5" /> Write Prescription
            </button>
          )}
        >
          {visit.prescriptions?.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No prescriptions</p>
          ) : (
            <div className="space-y-3">
              {visit.prescriptions?.map(rx => (
                <PrescriptionDetail key={rx.id} rx={rx} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Imaging / Radiology ── */}
        <SectionCard icon={PhotoIcon} title={`Imaging / Radiology (${imagingOrders.length})`}
          action={isOpen && (
            <button onClick={openImagingModal}
              className="text-xs text-primary-600 hover:underline font-medium flex items-center gap-1">
              <PlusIcon className="w-3.5 h-3.5" /> Order Imaging
            </button>
          )}
        >
          {imagingOrders.length === 0 ? (
            <div className="text-center py-4">
              <PhotoIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No imaging orders yet</p>
              {isOpen && (
                <button onClick={openImagingModal}
                  className="mt-2 text-xs text-primary-600 hover:underline font-medium">
                  + Order X-Ray, Ultrasound, CT or MRI
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {imagingOrders.map(order => (
                <div key={order.id} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-2">
                      <PhotoIcon className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.studies.map(s => s.label).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.urgency !== 'ROUTINE' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          order.urgency === 'STAT' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>{order.urgency}</span>
                      )}
                      <span className="text-xs text-gray-400">{new Date(order.orderedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {order.findings && (
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Findings</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{order.findings}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Admission (if admitted) ── */}
        {visit.admission && (
          <div className="lg:col-span-2">
            <SectionCard icon={BuildingOfficeIcon} title="Admission">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoRow label="Admission No" value={visit.admission.admissionNo} />
                <InfoRow label="Ward"         value={visit.admission.ward?.name}  />
                <InfoRow label="Bed"          value={visit.admission.bed?.bedNumber} />
                <InfoRow label="Status"       value={<StatusBadge status={visit.admission.status} />} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Discharge Note ── */}
        {visit.dischargeNote && (
          <div className="lg:col-span-2">
            <SectionCard icon={CheckCircleIcon} title="Discharge Note">
              <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                {visit.dischargeNote}
              </p>
              {visit.dischargedAt && (
                <p className="text-xs text-gray-400">
                  Discharged: {new Date(visit.dischargedAt).toLocaleString()}
                </p>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {/* ── Diagnose Modal ── */}
      <Modal isOpen={showDx} onClose={() => setShowDx(false)}
        title="Record Diagnosis & Notes" size="lg"
        footer={
          <>
            <button onClick={() => setShowDx(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveDx} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveDx} className="space-y-4">
          {[
            { key: 'chiefComplaint', label: 'Chief Complaint',            rows: 2 },
            { key: 'presentIllness', label: 'History of Present Illness', rows: 3 },
            { key: 'pastHistory',    label: 'Past Medical History',        rows: 2 },
            { key: 'physicalExam',   label: 'Physical Examination',        rows: 3 },
            { key: 'diagnosis',      label: 'Diagnosis',                   rows: 2 },
            { key: 'treatment',      label: 'Treatment Plan',              rows: 3 },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <textarea className="input" rows={f.rows}
                value={dxForm[f.key]}
                onChange={e => setDxForm(d => ({ ...d, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ICD Code</label>
              <input type="text" className="input" placeholder="e.g. J06.9"
                value={dxForm.icdCode}
                onChange={e => setDxForm(d => ({ ...d, icdCode: e.target.value }))} />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" className="input"
                value={dxForm.followUpDate}
                onChange={e => setDxForm(d => ({ ...d, followUpDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Referred To</label>
              <input type="text" className="input" placeholder="Department or hospital..."
                value={dxForm.referredTo}
                onChange={e => setDxForm(d => ({ ...d, referredTo: e.target.value }))} />
            </div>
            <div>
              <label className="label">Visit Status</label>
              <select className="input" value={dxForm.status}
                onChange={e => setDxForm(d => ({ ...d, status: e.target.value }))}>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_LAB">Pending Lab</option>
                <option value="PENDING_PHARMACY">Pending Pharmacy</option>
                <option value="COMPLETED">Completed</option>
                <option value="REFERRED">Referred</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Discharge Modal ── */}
      <Modal isOpen={showDc} onClose={() => setShowDc(false)}
        title="Discharge Patient" size="sm"
        footer={
          <>
            <button onClick={() => setShowDc(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDischarge} disabled={saving} className="btn-success">
              {saving ? 'Processing...' : 'Confirm Discharge'}
            </button>
          </>
        }
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
            Discharging <strong>{p?.firstName} {p?.lastName}</strong> from visit <strong>{visit.visitNo}</strong>.
            This will mark the visit as Completed.
          </div>
          <div>
            <label className="label">Discharge Note</label>
            <textarea className="input" rows={4} placeholder="Summary, instructions, medications to continue..."
              value={dcForm.dischargeNote}
              onChange={e => setDcForm(d => ({ ...d, dischargeNote: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* ── Order Imaging Modal ── */}
      <Modal isOpen={showImaging} onClose={() => setShowImaging(false)}
        title={`Order Imaging — ${visit.visitNo}`}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowImaging(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveImaging} disabled={imagingSaving} className="btn-primary">
              {imagingSaving ? 'Ordering...' : `Order ${imagingSelected.length} Study${imagingSelected.length !== 1 ? 's' : ''}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Patient info */}
          <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-sm text-purple-700 dark:text-purple-300">
            Patient: <strong>{p?.firstName} {p?.lastName}</strong> · {p?.patientId}
          </div>

          {/* Urgency */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Urgency</label>
              <select className="input" value={imagingUrgency} onChange={e => setImagingUrgency(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Clinical Indication / Reason</label>
              <input type="text" className="input" placeholder="Brief clinical reason..."
                value={imagingFindings}
                onChange={e => setImagingFindings(e.target.value)} />
            </div>
          </div>

          {/* Selected chips */}
          {imagingSelected.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              {imagingSelected.map(s => (
                <span key={s.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300
                    text-xs font-medium">
                  {s.label}
                  <button type="button" onClick={() => toggleImaging(s)}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Imaging types grouped */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto scrollbar-thin">
            {(() => {
              const grouped = {};
              IMAGING_TYPES.forEach(t => {
                if (!grouped[t.group]) grouped[t.group] = [];
                grouped[t.group].push(t);
              });
              return Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5
                    bg-gray-700 dark:bg-gray-900 text-white text-xs font-bold uppercase tracking-wider">
                    {group}
                    <span className="ml-auto text-gray-400 font-normal normal-case">
                      {items.filter(i => imagingSelected.find(s => s.id === i.id)).length}/{items.length} selected
                    </span>
                  </div>
                  {items.map(item => {
                    const sel = !!imagingSelected.find(s => s.id === item.id);
                    return (
                      <button key={item.id} type="button" onClick={() => toggleImaging(item)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2
                          border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm
                          transition-colors
                          ${sel ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${sel ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {sel && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                        <span className={sel ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      </Modal>

      {/* ── Write Prescription Modal ── */}
      <Modal isOpen={showRx} onClose={() => setShowRx(false)}
        title={`Write Prescription — ${visit.visitNo}`}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowRx(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveRx} disabled={rxSaving} className="btn-primary">
              {rxSaving ? 'Saving...' : `Save Prescription (${rxItems.length} drug${rxItems.length !== 1 ? 's' : ''})`}
            </button>
          </>
        }
      >
        <div className="space-y-4">

          {/* Patient info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            Patient: <strong>{p?.firstName} {p?.lastName}</strong> · {p?.patientId}
          </div>

          {/* Drug search */}
          <div>
            <label className="label">Search & Add Drugs *</label>
            <input type="text" className="input"
              placeholder="Type drug name, brand or code..."
              value={drugSearch}
              onChange={e => setDrugSearch(e.target.value)} />

            {drugSearch && filteredDrugs.length > 0 && (
              <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto scrollbar-thin">
                {filteredDrugs.map(drug => (
                  <button key={drug.id} type="button"
                    onClick={() => { addRxItem(drug); setDrugSearch(''); }}
                    disabled={!!rxItems.find(i => i.drugId === drug.id)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 text-sm
                      hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700
                      last:border-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{drug.genericName}</span>
                      {drug.brandName && <span className="text-gray-400 ml-1">({drug.brandName})</span>}
                      <span className="text-gray-400 ml-2 text-xs">{drug.strength} · {drug.form}</span>
                    </div>
                    <span className="text-xs text-gray-400">{drug.drugCode}</span>
                  </button>
                ))}
              </div>
            )}
            {drugSearch && filteredDrugs.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No drugs found for "{drugSearch}"</p>
            )}
          </div>

          {/* Selected drugs */}
          {rxItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Selected Drugs ({rxItems.length})
              </p>
              {rxItems.map(item => (
                <div key={item.drugId} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.drugName}</p>
                      <p className="text-xs text-gray-400">{item.strength} · {item.form}</p>
                    </div>
                    <button type="button" onClick={() => removeRxItem(item.drugId)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="label">Dosage *</label>
                      <input type="text" className="input text-sm"
                        placeholder="e.g. 500mg"
                        value={item.dosage}
                        onChange={e => updateRxItem(item.drugId, 'dosage', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Frequency *</label>
                      <select className="input text-sm" value={item.frequency}
                        onChange={e => updateRxItem(item.drugId, 'frequency', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 6 hours">Every 6 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="Every 12 hours">Every 12 hours</option>
                        <option value="At bedtime">At bedtime</option>
                        <option value="As needed">As needed</option>
                        <option value="Stat (immediately)">Stat (immediately)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Duration *</label>
                      <input type="text" className="input text-sm"
                        placeholder="e.g. 5 days"
                        value={item.duration}
                        onChange={e => updateRxItem(item.drugId, 'duration', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <input type="number" min="1" className="input text-sm"
                        value={item.quantity}
                        onChange={e => updateRxItem(item.drugId, 'quantity', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Instructions / Notes</label>
                    <input type="text" className="input text-sm"
                      placeholder="e.g. Take after food, avoid alcohol..."
                      value={item.notes}
                      onChange={e => updateRxItem(item.drugId, 'notes', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {rxItems.length === 0 && !drugSearch && (
            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              Search for drugs above to add them to the prescription
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Prescription Notes</label>
            <textarea className="input" rows={2}
              placeholder="General instructions for the patient..."
              value={rxNotes}
              onChange={e => setRxNotes(e.target.value)} />
          </div>
        </div>
      </Modal>
      <Modal isOpen={showLab} onClose={() => setShowLab(false)}
        title={`Order Lab Tests — ${visit?.visitNo}`}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowLab(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveLab} disabled={labSaving} className="btn-primary">
              {labSaving
                ? 'Creating...'
                : `Order ${selectedTests.length} Test${selectedTests.length !== 1 ? 's' : ''}`
              }
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Patient info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-700 dark:text-blue-300">
            Patient: <strong>{p?.firstName} {p?.lastName}</strong> · {p?.patientId}
            &nbsp;·&nbsp; Visit: <strong>{visit?.visitNo}</strong>
          </div>

          {/* Urgency & Sample */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Urgency</label>
              <select className="input" value={labUrgency} onChange={e => setLabUrgency(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
            <div>
              <label className="label">Sample Type</label>
              <input type="text" className="input" placeholder="e.g. Blood, Urine"
                value={labSample} onChange={e => setLabSample(e.target.value)} />
            </div>
            <div>
              <label className="label">Clinical Information</label>
              <input type="text" className="input" placeholder="Brief notes..."
                value={labClinical} onChange={e => setLabClinical(e.target.value)} />
            </div>
          </div>

          {/* Selected chips */}
          {selectedTests.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              {selectedTests.map(t => (
                <span key={t.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300
                    text-xs font-medium">
                  {t.testName}
                  <button onClick={() => toggleTest(t)}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Test search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input pl-9"
              placeholder="Search tests by name or code..."
              value={labTestSearch} onChange={e => setLabTestSearch(e.target.value)} />
          </div>

          {/* Test list — grouped by category matching hospital lab form */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
            {filteredTests.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {labTestSearch ? `No tests found for "${labTestSearch}"` : 'No tests in catalog'}
              </div>
            ) : (() => {
              // Group by category in hospital form order
              const CATEGORY_ORDER = [
                'HEMATOLOGY','STOOL TEST','URINALYSIS','MICROSCOPY',
                'SEROLOGY','BACTERIOLOGY','CHEMISTRY','LIPID PROFILE',
                'ELECTROLYTES','HCOG TEST','COAGULATION'
              ];
              const grouped = {};
              filteredTests.forEach(t => {
                const cat = t.category || 'OTHER';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(t);
              });
              // Sort categories: known order first, then alphabetical
              const sortedCats = Object.keys(grouped).sort((a, b) => {
                const ai = CATEGORY_ORDER.indexOf(a);
                const bi = CATEGORY_ORDER.indexOf(b);
                if (ai === -1 && bi === -1) return a.localeCompare(b);
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
              });
              return sortedCats.map(cat => (
                <div key={cat}>
                  {/* Category header — styled like hospital form section */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5
                    bg-gray-700 dark:bg-gray-900 text-white
                    text-xs font-bold uppercase tracking-wider">
                    {cat}
                    <span className="ml-auto text-gray-400 font-normal normal-case">
                      {grouped[cat].filter(t => selectedTests.find(s => s.id === t.id)).length}/{grouped[cat].length} selected
                    </span>
                  </div>
                  {grouped[cat].map(t => {
                    const sel = !!selectedTests.find(s => s.id === t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggleTest(t)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2
                          border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm
                          transition-colors
                          ${sel
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                            ${sel ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'}`}>
                            {sel && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            )}
                          </div>
                          <span className={sel ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-300'}>
                            {t.testName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {t.normalRange && t.normalRange !== 'See report' && (
                            <span className="text-xs text-gray-400 hidden sm:block">{t.normalRange}</span>
                          )}
                          <span className="text-xs text-gray-400">ETB {parseFloat(t.price || 0).toFixed(0)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
