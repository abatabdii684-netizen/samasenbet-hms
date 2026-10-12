import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientsAPI } from '@api/patients.api';
import { StatusBadge } from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import {
  ArrowLeftIcon, UserIcon, PhoneIcon, EnvelopeIcon,
  HeartIcon, BeakerIcon, ShoppingBagIcon, BanknotesIcon,
  BuildingOfficeIcon, CalendarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Visits', 'Admissions', 'Lab Results', 'Prescriptions', 'Billing'];

const bloodGroupLabel = (bg) => bg?.replace('_', ' ') || '—';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[140px]">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  );
}

function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient,  setPatient]  = useState(null);
  const [history,  setHistory]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('Overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, hRes] = await Promise.all([
          patientsAPI.getById(id),
          patientsAPI.getHistory(id),
        ]);
        setPatient(pRes.data.data);
        setHistory(hRes.data.data);
      } catch {
        toast.error('Failed to load patient');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading patient..." />;
  if (!patient) return null;

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25))
    : '—';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="page-title">{patient.firstName} {patient.lastName}</h1>
            <p className="page-subtitle">{patient.patientId} · {age} yrs · {patient.gender?.toLowerCase()}</p>
          </div>
        </div>
        <Link to={`/patients/${id}/edit`} className="btn-secondary">Edit Patient</Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CalendarIcon,       label: 'Total Visits',     value: patient._count?.visits      ?? '—', color: 'text-blue-600 bg-blue-50'   },
          { icon: BuildingOfficeIcon, label: 'Admissions',       value: patient._count?.admissions  ?? '—', color: 'text-purple-600 bg-purple-50' },
          { icon: BeakerIcon,         label: 'Lab Orders',       value: history?.labOrders?.length  ?? '—', color: 'text-yellow-600 bg-yellow-50' },
          { icon: BanknotesIcon,      label: 'Bills',            value: patient._count?.bills       ?? '—', color: 'text-green-600 bg-green-50'  },
        ].map((c) => (
          <div key={c.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${tab === t
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Personal Information
            </h3>
            <div className="space-y-2">
              <InfoRow label="Full Name"       value={`${patient.firstName} ${patient.lastName}`} />
              <InfoRow label="Date of Birth"   value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'} />
              <InfoRow label="Age"             value={`${age} years`} />
              <InfoRow label="Gender"          value={patient.gender} />
              <InfoRow label="Blood Group"     value={bloodGroupLabel(patient.bloodGroup)} />
              <InfoRow label="Marital Status"  value={patient.maritalStatus} />
              <InfoRow label="National ID"     value={patient.nationalId} />
              <InfoRow label="Status"          value={<StatusBadge status={patient.isActive ? 'ACTIVE' : 'INACTIVE'} />} />
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PhoneIcon className="w-4 h-4" /> Contact Information
            </h3>
            <div className="space-y-2">
              <InfoRow label="Phone"     value={patient.phone} />
              <InfoRow label="Email"     value={patient.email} />
              <InfoRow label="Address"   value={patient.address} />
              <InfoRow label="City"      value={patient.city} />
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Emergency Contact</p>
              <div className="space-y-2">
                <InfoRow label="Name"         value={patient.emergencyContact} />
                <InfoRow label="Phone"        value={patient.emergencyPhone} />
                <InfoRow label="Relationship" value={patient.emergencyRelation} />
              </div>
            </div>
          </div>

          {/* Medical Background */}
          <div className="card p-5 space-y-3 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HeartIcon className="w-4 h-4" /> Medical Background
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Known Allergies</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {patient.allergies || 'None recorded'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Chronic Diseases</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {patient.chronicDiseases || 'None recorded'}
                </p>
              </div>
            </div>
          </div>

          {/* Insurance */}
          {patient.insurances?.length > 0 && (
            <div className="card p-5 space-y-3 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Insurance Coverage</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Provider</th><th>Policy No.</th><th>Member No.</th>
                      <th>Coverage</th><th>Expiry</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {patient.insurances.map((ins) => (
                      <tr key={ins.id}>
                        <td>{ins.provider?.name}</td>
                        <td>{ins.policyNumber}</td>
                        <td>{ins.memberNumber || '—'}</td>
                        <td>{ins.coverageType || '—'}</td>
                        <td>{ins.endDate ? new Date(ins.endDate).toLocaleDateString() : 'Unlimited'}</td>
                        <td><StatusBadge status={ins.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Visits' && (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Visit No.</th><th>Date</th><th>Doctor</th>
                  <th>Clinic</th><th>Diagnosis</th><th>Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {history?.visits?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No visits recorded</td></tr>
                )}
                {history?.visits?.map((v) => (
                  <tr key={v.id}>
                    <td><Link to={`/opd/${v.id}`} className="text-primary-600 hover:underline font-medium">{v.visitNo}</Link></td>
                    <td>{new Date(v.visitDate).toLocaleDateString()}</td>
                    <td>{v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : '—'}</td>
                    <td>{v.clinicType?.replace(/_/g, ' ')}</td>
                    <td className="max-w-xs truncate">{v.diagnosis || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Admissions' && (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Admission No.</th><th>Date</th><th>Ward</th>
                  <th>Bed</th><th>Diagnosis</th><th>Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {history?.admissions?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No admissions recorded</td></tr>
                )}
                {history?.admissions?.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium">{a.admissionNo}</td>
                    <td>{new Date(a.admissionDate).toLocaleDateString()}</td>
                    <td>{a.ward?.name || '—'}</td>
                    <td>{a.bed?.bedNumber || '—'}</td>
                    <td className="max-w-xs truncate">{a.diagnosis || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Lab Results' && (
        <div className="space-y-4">
          {history?.labOrders?.length === 0 && (
            <div className="card p-12 text-center text-gray-400">No lab orders recorded</div>
          )}
          {history?.labOrders?.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Link to={`/laboratory/${order.id}`} className="font-medium text-primary-600 hover:underline">{order.orderNo}</Link>
                  <span className="ml-3 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
              {order.items?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table text-sm">
                    <thead><tr><th>Test</th><th>Result</th><th>Unit</th><th>Normal Range</th><th>Abnormal</th></tr></thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.test?.testName}</td>
                          <td className={item.isAbnormal ? 'text-red-600 font-medium' : ''}>{item.result || '—'}</td>
                          <td>{item.unit || '—'}</td>
                          <td>{item.normalRange || '—'}</td>
                          <td>{item.isAbnormal ? <span className="text-red-600 text-xs font-medium">Yes</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Prescriptions' && (
        <div className="space-y-4">
          {history?.prescriptions?.length === 0 && (
            <div className="card p-12 text-center text-gray-400">No prescriptions recorded</div>
          )}
          {history?.prescriptions?.map((rx) => (
            <div key={rx.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{rx.prescriptionNo}</span>
                  <span className="ml-3 text-sm text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={rx.status} />
              </div>
              {rx.items?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table text-sm">
                    <thead><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr></thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {rx.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.drug?.genericName}</td>
                          <td>{item.dosage}</td>
                          <td>{item.frequency}</td>
                          <td>{item.duration}</td>
                          <td>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Billing' && (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No.</th><th>Date</th><th>Total</th>
                  <th>Paid</th><th>Due</th><th>Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {(!history?.visits || history.visits.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No bills recorded</td></tr>
                )}
                {patient._count?.bills === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No bills recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDetailPage;
