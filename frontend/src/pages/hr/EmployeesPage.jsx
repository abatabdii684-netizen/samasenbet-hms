import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable       from '@components/common/DataTable';
import Modal           from '@components/common/Modal';
import { StatusBadge } from '@components/common/Badge';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { employeesAPI } from '@api/employees.api';
import { usePagination } from '@hooks/usePagination';
import { useDebounce }   from '@hooks/useDebounce';
import toast from 'react-hot-toast';
import api from '@api/axios';

const EMP_TYPES = [
  { v: 'FULL_TIME',  l: 'Full Time'  },
  { v: 'PART_TIME',  l: 'Part Time'  },
  { v: 'CONTRACT',   l: 'Contract'   },
  { v: 'INTERN',     l: 'Intern'     },
];

const EMPTY = {
  firstName:'', lastName:'', gender:'MALE', dateOfBirth:'', nationalId:'',
  phone:'', email:'', address:'', departmentId:'', jobTitle:'',
  specialization:'', employmentType:'FULL_TIME', hireDate:'',
  basicSalary:'', licenseNumber:'', qualifications:'',
  emergencyContact:'', emergencyPhone:'', bankName:'', bankAccount:'',
};

// ── simple field component with explicit value/onChange props ──────
function Field({ label, value, onChange, type = 'text', required = false, children }) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      {children ?? (
        <input
          type={type}
          className="input"
          value={value}
          onChange={onChange}
          required={required}
        />
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [deptId,    setDeptId]    = useState('');
  const [empStatus, setEmpStatus] = useState('');
  const [depts,     setDepts]     = useState([]);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editEmp,   setEditEmp]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  const debounced = useDebounce(search);
  const { page, limit, goToPage, resetPage } = usePagination();

  // ── helpers ──────────────────────────────────────────────────────
  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ── data fetching ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll({
        page, limit,
        search:       debounced   || undefined,
        departmentId: deptId      || undefined,
        status:       empStatus   || undefined,
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.meta?.pagination?.total ?? 0);
    } catch { toast.error('Failed to load employees'); }
    finally  { setLoading(false); }
  }, [page, limit, debounced, deptId, empStatus]);

  const fetchDepts = useCallback(async () => {
    try {
      const res = await api.get('/departments');
      setDepts(res.data?.data ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData();  }, [fetchData]);
  useEffect(() => { fetchDepts(); }, [fetchDepts]);
  useEffect(() => { resetPage();  }, [debounced, deptId, empStatus]);

  // ── open modal ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditEmp(null);
    setForm(EMPTY);
    setShowAdd(true);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({
      firstName:        emp.firstName,
      lastName:         emp.lastName,
      gender:           emp.gender || 'MALE',
      dateOfBirth:      emp.dateOfBirth  ? emp.dateOfBirth.split('T')[0]  : '',
      nationalId:       emp.nationalId   ?? '',
      phone:            emp.phone        || '',
      email:            emp.email        ?? '',
      address:          emp.address      ?? '',
      departmentId:     String(emp.departmentId || ''),
      jobTitle:         emp.jobTitle     || '',
      specialization:   emp.specialization ?? '',
      employmentType:   emp.employmentType || 'FULL_TIME',
      hireDate:         emp.hireDate ? emp.hireDate.split('T')[0] : '',
      basicSalary:      emp.basicSalary   ?? '',
      licenseNumber:    emp.licenseNumber ?? '',
      qualifications:   emp.qualifications ?? '',
      emergencyContact: emp.emergencyContact ?? '',
      emergencyPhone:   emp.emergencyPhone   ?? '',
      bankName:         emp.bankName         ?? '',
      bankAccount:      emp.bankAccount      ?? '',
    });
    setShowAdd(true);
  };

  const closeModal = () => {
    setShowAdd(false);
    setEditEmp(null);
    setForm(EMPTY);
  };

  // ── save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.firstName.trim())  { toast.error('First name is required');   return; }
    if (!form.lastName.trim())   { toast.error('Last name is required');    return; }
    if (!form.phone.trim())      { toast.error('Phone number is required'); return; }
    if (!form.departmentId)      { toast.error('Department is required');   return; }
    if (!form.jobTitle.trim())   { toast.error('Job title is required');    return; }
    if (!editEmp) {
      if (!form.dateOfBirth)     { toast.error('Date of birth is required'); return; }
      if (!form.hireDate)        { toast.error('Hire date is required');     return; }
      if (!form.basicSalary)     { toast.error('Basic salary is required');  return; }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        departmentId: parseInt(form.departmentId),
        basicSalary:  parseFloat(form.basicSalary) || 0,
      };

      if (editEmp) {
        await employeesAPI.update(editEmp.id, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeesAPI.create(payload);
        toast.success('Employee added successfully');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  // ── toggle status ─────────────────────────────────────────────────
  const handleToggleStatus = async (emp) => {
    if (!window.confirm(`${emp.status === 'ACTIVE' ? 'Suspend' : 'Activate'} ${emp.firstName} ${emp.lastName}?`)) return;
    try {
      await employeesAPI.toggleStatus(emp.id);
      toast.success('Status updated');
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  // ── table columns ──────────────────────────────────────────────────
  const columns = [
    {
      key: 'employeeNo', label: 'Emp. No',
      render: (v) => <span className="font-mono text-xs font-semibold text-primary-600">{v}</span>,
    },
    {
      key: 'firstName', label: 'Name',
      render: (_, r) => (
        <div>
          <Link to={`/employees/${r.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
            {r.firstName} {r.lastName}
          </Link>
          <div className="text-xs text-gray-400">{r.jobTitle}</div>
        </div>
      ),
    },
    { key: 'department', label: 'Department', render: (_, r) => r.department?.name ?? '—' },
    { key: 'phone',      label: 'Phone' },
    {
      key: 'employmentType', label: 'Type',
      render: (v) => <span className="badge badge-blue text-xs">{v?.replace(/_/g, ' ')}</span>,
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, r) => (
        <div className="flex items-center gap-1">
          <Link to={`/employees/${r.id}`}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 inline-flex"
            title="View">
            <EyeIcon className="w-4 h-4" />
          </Link>
          <button onClick={() => openEdit(r)}
            className="text-xs text-primary-600 hover:underline px-1">
            Edit
          </button>
          <button
            onClick={() => handleToggleStatus(r)}
            className={`text-xs hover:underline px-1 ${r.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`}>
            {r.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage hospital staff and HR records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input type="text" className="input"
            placeholder="Search by name, ID, job title..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={deptId} onChange={e => setDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input" value={empStatus} onChange={e => setEmpStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns} data={data} loading={loading}
        pagination={{ page, limit, total, totalPages: Math.ceil(total / limit) }}
        onPageChange={goToPage} emptyText="No employees found"
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAdd}
        onClose={closeModal}
        title={editEmp ? `Edit — ${editEmp.firstName} ${editEmp.lastName}` : 'Add New Employee'}
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editEmp ? 'Save Changes' : 'Add Employee'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Personal Info ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Personal Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="First Name" required value={form.firstName} onChange={set('firstName')} />
              <Field label="Last Name"  required value={form.lastName}  onChange={set('lastName')} />

              <Field label="Gender">
                <select className="input" value={form.gender} onChange={set('gender')}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </Field>

              <Field label="Date of Birth" required={!editEmp} type="date"
                value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              <Field label="National ID"  value={form.nationalId}  onChange={set('nationalId')} />
              <Field label="Phone"        required value={form.phone}  onChange={set('phone')} />
              <Field label="Email"        type="email" value={form.email}   onChange={set('email')} />
              <div className="sm:col-span-2">
                <Field label="Address"    value={form.address} onChange={set('address')} />
              </div>
            </div>
          </div>

          {/* ── Employment ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Employment Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <Field label="Department" required>
                <select className="input" value={form.departmentId} onChange={set('departmentId')} required>
                  <option value="">Select department...</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>

              <Field label="Job Title" required value={form.jobTitle} onChange={set('jobTitle')} />
              <Field label="Specialization" value={form.specialization} onChange={set('specialization')} />

              <Field label="Employment Type">
                <select className="input" value={form.employmentType} onChange={set('employmentType')}>
                  {EMP_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </Field>

              <Field label="Hire Date" required={!editEmp} type="date"
                value={form.hireDate} onChange={set('hireDate')} />
              <Field label="Basic Salary (ETB)" required={!editEmp} type="number"
                value={form.basicSalary} onChange={set('basicSalary')} />
              <Field label="License Number" value={form.licenseNumber} onChange={set('licenseNumber')} />
              <div className="sm:col-span-2">
                <Field label="Qualifications" value={form.qualifications} onChange={set('qualifications')} />
              </div>
            </div>
          </div>

          {/* ── Emergency & Bank ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Emergency Contact &amp; Bank Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Emergency Contact Name"  value={form.emergencyContact} onChange={set('emergencyContact')} />
              <Field label="Emergency Contact Phone" value={form.emergencyPhone}   onChange={set('emergencyPhone')} />
              <Field label="Bank Name"               value={form.bankName}         onChange={set('bankName')} />
              <Field label="Bank Account Number"     value={form.bankAccount}      onChange={set('bankAccount')} />
            </div>
          </div>

        </form>
      </Modal>
    </div>
  );
}
