import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsAPI } from '@api/patients.api';
import FormField from '@components/common/FormField';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Derive age from dateOfBirth
const dobToAge = (dob) => {
  if (!dob) return '';
  return Math.floor(
    (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25)
  ).toString();
};

// Convert age back to DOB (Jan 1 of birth year)
const ageToDob = (age) => {
  const year = new Date().getFullYear() - parseInt(age, 10);
  return `${year}-01-01`;
};

export default function EditPatientPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [loading, setLoading]  = useState(true);
  const [saving,  setSaving]   = useState(false);
  const [form,    setForm]     = useState({
    firstName: '', middleName: '', lastName: '', age: '',
    gender: '', phone: '', email: '', address: '',
    nationalId: '', maritalStatus: '',
    emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
    allergies: '', chronicDiseases: '',
  });

  // ── load patient ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await patientsAPI.getById(id);
        const p   = res.data?.data;
        setForm({
          firstName:        p.firstName        || '',
          middleName:       '',                         // stored in firstName, no separate field
          lastName:         p.lastName         || '',
          age:              dobToAge(p.dateOfBirth),
          gender:           p.gender           || '',
          phone:            p.phone            || '',
          email:            p.email            || '',
          address:          p.address          || '',
          nationalId:       p.nationalId       || '',
          maritalStatus:    p.maritalStatus    || '',
          emergencyContact: p.emergencyContact || '',
          emergencyPhone:   p.emergencyPhone   || '',
          emergencyRelation:p.emergencyRelation|| '',
          allergies:        p.allergies        || '',
          chronicDiseases:  p.chronicDiseases  || '',
        });
      } catch {
        toast.error('Failed to load patient');
        navigate('/patients');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── save ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim()) { toast.error('First name is required');   return; }
    if (!form.lastName.trim())  { toast.error('Last name is required');    return; }
    if (!form.phone.trim())     { toast.error('Phone number is required'); return; }
    if (!form.gender)           { toast.error('Gender is required');       return; }
    if (!form.age)              { toast.error('Age is required');          return; }

    setSaving(true);
    try {
      const payload = {
        firstName: form.middleName?.trim()
          ? `${form.firstName.trim()} ${form.middleName.trim()}`
          : form.firstName.trim(),
        lastName:         form.lastName,
        dateOfBirth:      form.age ? ageToDob(form.age) : undefined,
        gender:           form.gender,
        phone:            form.phone,
        email:            form.email         || undefined,
        address:          form.address       || undefined,
        nationalId:       form.nationalId    || undefined,
        maritalStatus:    form.maritalStatus || undefined,
        emergencyContact: form.emergencyContact || undefined,
        emergencyPhone:   form.emergencyPhone   || undefined,
        emergencyRelation:form.emergencyRelation|| undefined,
        allergies:        form.allergies        || undefined,
        chronicDiseases:  form.chronicDiseases  || undefined,
      };

      await patientsAPI.update(id, payload);
      toast.success('Patient updated successfully');
      navigate(`/patients/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading patient..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">

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
          <h1 className="page-title">Edit Patient</h1>
          <p className="page-subtitle">Update patient information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Personal Information ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <FormField label="First Name" required>
              <input className="input" value={form.firstName}
                onChange={set('firstName')} placeholder="First name" />
            </FormField>

            <FormField label="Middle Name">
              <input className="input" value={form.middleName}
                onChange={set('middleName')} placeholder="Middle name (optional)" />
            </FormField>

            <FormField label="Last Name" required>
              <input className="input" value={form.lastName}
                onChange={set('lastName')} placeholder="Last name" />
            </FormField>

            <FormField label="Age (years)" required>
              <input type="number" min="0" max="150" className="input"
                value={form.age} onChange={set('age')} placeholder="e.g. 35" />
            </FormField>

            <FormField label="Gender" required>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>

            <FormField label="Phone Number" required>
              <input className="input" value={form.phone}
                onChange={set('phone')} placeholder="+251912345678 or 0912345678" />
              <p className="text-xs text-gray-400 mt-1">Ethiotelecom: 09XX · Safaricom ET: 07XX</p>
            </FormField>

          </div>
        </div>

        {/* ── Contact Information ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
            <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email">
              <input type="email" className="input" value={form.email}
                onChange={set('email')} />
            </FormField>
            <FormField label="National ID">
              <input className="input" value={form.nationalId}
                onChange={set('nationalId')} placeholder="e.g. ETH/1234567/XX" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Address">
                <textarea className="input resize-none" rows={2}
                  value={form.address} onChange={set('address')} />
              </FormField>
            </div>
          </div>
        </div>

        {/* ── Marital Status ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Marital Status
            <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
          </h2>
          <div className="max-w-xs">
            <FormField label="Marital Status">
              <select className="input" value={form.maritalStatus} onChange={set('maritalStatus')}>
                <option value="">Select status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Emergency Contact
            <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Contact Name">
              <input className="input" value={form.emergencyContact}
                onChange={set('emergencyContact')} />
            </FormField>
            <FormField label="Phone">
              <input className="input" value={form.emergencyPhone}
                onChange={set('emergencyPhone')} placeholder="+251912345678 or 0912345678" />
              <p className="text-xs text-gray-400 mt-1">Ethiotelecom: 09XX · Safaricom ET: 07XX</p>
            </FormField>
            <FormField label="Relationship">
              <input className="input" value={form.emergencyRelation}
                onChange={set('emergencyRelation')} />
            </FormField>
          </div>
        </div>

        {/* ── Medical Background ── */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Medical Background
            <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Known Allergies">
              <textarea className="input resize-none" rows={3}
                placeholder="e.g. Penicillin, Pollen..."
                value={form.allergies} onChange={set('allergies')} />
            </FormField>
            <FormField label="Chronic Diseases">
              <textarea className="input resize-none" rows={3}
                placeholder="e.g. Diabetes, Hypertension..."
                value={form.chronicDiseases} onChange={set('chronicDiseases')} />
            </FormField>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
