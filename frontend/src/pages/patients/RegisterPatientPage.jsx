import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { patientsAPI } from '@api/patients.api';
import toast from 'react-hot-toast';
import FormField from '@components/common/FormField';
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { printOrderSheet } from '@utils/printOrderSheet';

const ageToDob = (age) => {
  const year = new Date().getFullYear() - parseInt(age, 10);
  return `${year}-01-01`;
};

function CollapsibleSection({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left
                   hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900 dark:text-white">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700
                             text-gray-500 dark:text-gray-400 font-medium">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUpIcon   className="w-5 h-5 text-gray-400" />
          : <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Print confirmation modal ──────────────────────────────────────
function PrintConfirmModal({ patient, onPrint, onSkip }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Patient Registered!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <strong>{patient.firstName} {patient.lastName}</strong>
            <br />
            Card No: <strong className="text-primary-600">{patient.patientId}</strong>
          </p>
        </div>

        {/* Print prompt */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-700 dark:text-blue-300 text-center">
          Do you want to print the <strong>Order Sheet</strong> for this patient?
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="btn-secondary flex-1"
          >
            Skip
          </button>
          <button
            onClick={onPrint}
            className="btn-primary flex-1"
          >
            <PrinterIcon className="w-4 h-4" /> Print Order Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPatientPage() {
  const navigate = useNavigate();
  const [loading,         setLoading]         = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null); // triggers print modal
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        firstName: data.middleName?.trim()
          ? `${data.firstName.trim()} ${data.middleName.trim()}`
          : data.firstName.trim(),
        dateOfBirth: data.age ? ageToDob(data.age) : undefined,
      };
      delete payload.age;
      delete payload.middleName;

      const res = await patientsAPI.create(payload);
      const patient = res.data.data;
      toast.success('Patient registered successfully');

      // Show print confirmation instead of navigating immediately
      setRegisteredPatient(patient);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    printOrderSheet(registeredPatient);
    navigate(`/patients/${registeredPatient.id}`);
  };

  const handleSkip = () => {
    navigate(`/patients/${registeredPatient.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">

      {/* Print confirmation modal */}
      {registeredPatient && (
        <PrintConfirmModal
          patient={registeredPatient}
          onPrint={handlePrint}
          onSkip={handleSkip}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700
                       dark:hover:text-gray-300 mb-1"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back
          </button>
          <h1 className="page-title">Register New Patient</h1>
          <p className="page-subtitle">Fields marked with * are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Personal Information ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <FormField label="First Name" error={errors.firstName?.message} required>
              <input
                className={`input ${errors.firstName ? 'input-error' : ''}`}
                placeholder="First name"
                {...register('firstName', { required: 'First name is required' })}
              />
            </FormField>

            <FormField label="Middle Name">
              <input
                className="input"
                placeholder="Middle name (optional)"
                {...register('middleName')}
              />
            </FormField>

            <FormField label="Last Name" error={errors.lastName?.message} required>
              <input
                className={`input ${errors.lastName ? 'input-error' : ''}`}
                placeholder="Last name"
                {...register('lastName', { required: 'Last name is required' })}
              />
            </FormField>

            <FormField label="Age (years)" error={errors.age?.message} required>
              <input
                type="number"
                min="0"
                max="150"
                className={`input ${errors.age ? 'input-error' : ''}`}
                placeholder="e.g. 35"
                {...register('age', {
                  required: 'Age is required',
                  min: { value: 0,   message: 'Age cannot be negative' },
                  max: { value: 150, message: 'Age cannot exceed 150' },
                })}
              />
            </FormField>

            <FormField label="Gender" error={errors.gender?.message} required>
              <select
                className={`input ${errors.gender ? 'input-error' : ''}`}
                {...register('gender', { required: 'Gender is required' })}
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>

            <FormField label="Phone Number" error={errors.phone?.message} required>
              <input
                className={`input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+251912345678 or 0912345678"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^(\+2519\d{8}|\+2517\d{8}|09\d{8}|07\d{8})$/,
                    message: 'Enter a valid Ethiopian number (e.g. 0912345678 or +251912345678)',
                  },
                })}
              />
              <p className="text-xs text-gray-400 mt-1">Ethiotelecom: 09XX · Safaricom ET: 07XX</p>
            </FormField>

          </div>
        </div>

        {/* ── Optional: Contact Information ── */}
        <CollapsibleSection title="Contact Information" badge="Optional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email">
              <input type="email" className="input" placeholder="example@email.com"
                {...register('email')} />
            </FormField>
            <FormField label="National ID">
              <input className="input" placeholder="e.g. ETH/1234567/XX"
                {...register('nationalId')} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Address">
                <textarea className="input resize-none" rows={2}
                  placeholder="Street, city, region..."
                  {...register('address')} />
              </FormField>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Optional: Marital Status ── */}
        <CollapsibleSection title="Marital Status" badge="Optional">
          <div className="max-w-xs">
            <FormField label="Marital Status">
              <select className="input" {...register('maritalStatus')}>
                <option value="">Select status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </FormField>
          </div>
        </CollapsibleSection>

        {/* ── Optional: Emergency Contact ── */}
        <CollapsibleSection title="Emergency Contact" badge="Optional">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Contact Name">
              <input className="input" placeholder="Full name"
                {...register('emergencyContact')} />
            </FormField>
            <FormField label="Phone">
              <input className="input" placeholder="+251912345678 or 0912345678"
                {...register('emergencyPhone')} />
              <p className="text-xs text-gray-400 mt-1">Ethiotelecom: 09XX · Safaricom ET: 07XX</p>
            </FormField>
            <FormField label="Relationship">
              <input className="input" placeholder="e.g. Spouse, Parent"
                {...register('emergencyRelation')} />
            </FormField>
          </div>
        </CollapsibleSection>

        {/* ── Optional: Medical Background ── */}
        <CollapsibleSection title="Medical Background" badge="Optional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Known Allergies">
              <textarea className="input resize-none" rows={3}
                placeholder="e.g. Penicillin, Pollen..."
                {...register('allergies')} />
            </FormField>
            <FormField label="Chronic Diseases">
              <textarea className="input resize-none" rows={3}
                placeholder="e.g. Diabetes, Hypertension..."
                {...register('chronicDiseases')} />
            </FormField>
          </div>
        </CollapsibleSection>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Register Patient'}
          </button>
        </div>

      </form>
    </div>
  );
}
