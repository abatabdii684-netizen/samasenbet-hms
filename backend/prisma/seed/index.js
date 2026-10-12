/**
 * Database Seed File
 * Yohannes Fantaye Metasebiya General Hospital PLC — HMS
 * Seeds: Roles, Permissions, Admin User, Departments, Wards, Beds,
 *        Operation Rooms, Service Types, Lab Tests, Drugs, Inventory
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── ROLES ───────────────────────────────────────────────────────
const ROLES = [
  { name: 'CEO',                    displayName: 'Chief Executive Officer',       isSystem: true },
  { name: 'ADMIN_FINANCE',          displayName: 'Admin / Finance Head',           isSystem: true },
  { name: 'GENERAL_SERVICE',        displayName: 'General Service Head',           isSystem: true },
  { name: 'MEDICAL_DIRECTOR',       displayName: 'Medical Director',               isSystem: true },
  { name: 'MEDICAL_SUPERVISOR',     displayName: 'Medical Supervisor',             isSystem: true },
  { name: 'RECEPTION_HEAD',         displayName: 'Reception Head',                 isSystem: false },
  { name: 'LAB_HEAD',               displayName: 'Laboratory Head',                isSystem: false },
  { name: 'PHARMACY_HEAD',          displayName: 'Pharmacy Head',                  isSystem: false },
  { name: 'OR_HEAD',                displayName: 'Operation Room Head',            isSystem: false },
  { name: 'DELIVERY_HEAD',          displayName: 'Delivery Head',                  isSystem: false },
  { name: 'MATRON',                 displayName: 'Matron',                         isSystem: false },
  { name: 'OPD_HEAD',               displayName: 'General OPD Head',               isSystem: false },
  { name: 'WARD_HEAD',              displayName: 'Medical/Surgical Ward Head',      isSystem: false },
  { name: 'MAINTENANCE_HEAD',       displayName: 'Maintenance Head',               isSystem: false },
  { name: 'SECURITY_HEAD',          displayName: 'Security Head',                  isSystem: false },
  { name: 'SANITATION_HEAD',        displayName: 'Sanitation Head',                isSystem: false },
  { name: 'PROPERTY_HEAD',          displayName: 'Property Management Head',       isSystem: false },
  { name: 'PURCHASE_OFFICER',       displayName: 'Purchase Officer',               isSystem: false },
  { name: 'CANTEEN_OFFICER',        displayName: 'Canteen Officer',                isSystem: false },
  { name: 'PROMOTION_OFFICER',      displayName: 'Promotion Officer',              isSystem: false },
  { name: 'DOCTOR',                 displayName: 'Doctor',                         isSystem: false },
  { name: 'NURSE',                  displayName: 'Nurse',                          isSystem: false },
  { name: 'CASHIER',                displayName: 'Cashier',                        isSystem: false },
  { name: 'LAB_TECHNICIAN',         displayName: 'Lab Technician',                 isSystem: false },
  { name: 'PHARMACIST',             displayName: 'Pharmacist',                     isSystem: false },
  { name: 'STORE_MANAGER',          displayName: 'Store Manager',                  isSystem: false },
  { name: 'HR_OFFICER',             displayName: 'HR Officer',                     isSystem: false },
];

// ─── PERMISSIONS ─────────────────────────────────────────────────
const PERMISSIONS = [
  // Dashboard
  { name: 'dashboard:view',           displayName: 'View Dashboard',             module: 'dashboard',  action: 'view' },
  // Users
  { name: 'users:view',               displayName: 'View Users',                 module: 'users',      action: 'view' },
  { name: 'users:create',             displayName: 'Create Users',               module: 'users',      action: 'create' },
  { name: 'users:update',             displayName: 'Update Users',               module: 'users',      action: 'update' },
  { name: 'users:delete',             displayName: 'Delete Users',               module: 'users',      action: 'delete' },
  // Roles
  { name: 'roles:view',               displayName: 'View Roles',                 module: 'roles',      action: 'view' },
  { name: 'roles:manage',             displayName: 'Manage Roles',               module: 'roles',      action: 'manage' },
  // Patients
  { name: 'patients:view',            displayName: 'View Patients',              module: 'patients',   action: 'view' },
  { name: 'patients:create',          displayName: 'Register Patients',          module: 'patients',   action: 'create' },
  { name: 'patients:update',          displayName: 'Update Patients',            module: 'patients',   action: 'update' },
  { name: 'patients:delete',          displayName: 'Delete Patients',            module: 'patients',   action: 'delete' },
  // Appointments
  { name: 'appointments:view',        displayName: 'View Appointments',          module: 'appointments', action: 'view' },
  { name: 'appointments:create',      displayName: 'Create Appointments',        module: 'appointments', action: 'create' },
  { name: 'appointments:update',      displayName: 'Update Appointments',        module: 'appointments', action: 'update' },
  { name: 'appointments:delete',      displayName: 'Cancel Appointments',        module: 'appointments', action: 'delete' },
  // Triage
  { name: 'triage:view',              displayName: 'View Triage',                module: 'triage',     action: 'view' },
  { name: 'triage:create',            displayName: 'Record Triage',              module: 'triage',     action: 'create' },
  { name: 'triage:update',            displayName: 'Update Triage',              module: 'triage',     action: 'update' },
  // OPD
  { name: 'opd:view',                 displayName: 'View OPD',                   module: 'opd',        action: 'view' },
  { name: 'opd:create',               displayName: 'Create OPD Visit',           module: 'opd',        action: 'create' },
  { name: 'opd:diagnose',             displayName: 'Record Diagnosis',           module: 'opd',        action: 'diagnose' },
  { name: 'opd:prescribe',            displayName: 'Write Prescriptions',        module: 'opd',        action: 'prescribe' },
  // Laboratory
  { name: 'lab:view',                 displayName: 'View Lab Orders',            module: 'laboratory', action: 'view' },
  { name: 'lab:create',               displayName: 'Create Lab Orders',          module: 'laboratory', action: 'create' },
  { name: 'lab:enter_results',        displayName: 'Enter Lab Results',          module: 'laboratory', action: 'enter_results' },
  { name: 'lab:approve',              displayName: 'Approve Lab Results',        module: 'laboratory', action: 'approve' },
  { name: 'lab:manage_catalog',       displayName: 'Manage Lab Catalog',         module: 'laboratory', action: 'manage_catalog' },
  // Pharmacy
  { name: 'pharmacy:view',            displayName: 'View Prescriptions',         module: 'pharmacy',   action: 'view' },
  { name: 'pharmacy:dispense',        displayName: 'Dispense Medications',       module: 'pharmacy',   action: 'dispense' },
  { name: 'pharmacy:manage_drugs',    displayName: 'Manage Drug Catalog',        module: 'pharmacy',   action: 'manage_drugs' },
  { name: 'pharmacy:manage_stock',    displayName: 'Manage Drug Stock',          module: 'pharmacy',   action: 'manage_stock' },
  // Inventory
  { name: 'inventory:view',           displayName: 'View Inventory',             module: 'inventory',  action: 'view' },
  { name: 'inventory:manage',         displayName: 'Manage Inventory',           module: 'inventory',  action: 'manage' },
  // Billing
  { name: 'billing:view',             displayName: 'View Bills',                 module: 'billing',    action: 'view' },
  { name: 'billing:create',           displayName: 'Create Bills',               module: 'billing',    action: 'create' },
  { name: 'billing:update',           displayName: 'Update Bills',               module: 'billing',    action: 'update' },
  { name: 'billing:finalize',         displayName: 'Finalize Bills',             module: 'billing',    action: 'finalize' },
  { name: 'payments:receive',         displayName: 'Receive Payments',           module: 'payments',   action: 'receive' },
  { name: 'payments:refund',          displayName: 'Process Refunds',            module: 'payments',   action: 'refund' },
  // Insurance
  { name: 'insurance:view',           displayName: 'View Insurance',             module: 'insurance',  action: 'view' },
  { name: 'insurance:manage',         displayName: 'Manage Insurance',           module: 'insurance',  action: 'manage' },
  // Admissions & Ward
  { name: 'admissions:view',          displayName: 'View Admissions',            module: 'admissions', action: 'view' },
  { name: 'admissions:create',        displayName: 'Admit Patients',             module: 'admissions', action: 'create' },
  { name: 'admissions:discharge',     displayName: 'Discharge Patients',         module: 'admissions', action: 'discharge' },
  { name: 'wards:manage',             displayName: 'Manage Wards',               module: 'wards',      action: 'manage' },
  { name: 'beds:manage',              displayName: 'Manage Beds',                module: 'beds',       action: 'manage' },
  // Operation Room
  { name: 'or:view',                  displayName: 'View Operation Schedules',   module: 'operation_room', action: 'view' },
  { name: 'or:schedule',              displayName: 'Schedule Operations',        module: 'operation_room', action: 'schedule' },
  { name: 'or:update',                displayName: 'Update Operation Records',   module: 'operation_room', action: 'update' },
  // Delivery
  { name: 'delivery:view',            displayName: 'View Delivery Records',      module: 'delivery',   action: 'view' },
  { name: 'delivery:create',          displayName: 'Create Delivery Records',    module: 'delivery',   action: 'create' },
  { name: 'delivery:update',          displayName: 'Update Delivery Records',    module: 'delivery',   action: 'update' },
  // Employees
  { name: 'employees:view',           displayName: 'View Employees',             module: 'employees',  action: 'view' },
  { name: 'employees:create',         displayName: 'Add Employees',              module: 'employees',  action: 'create' },
  { name: 'employees:update',         displayName: 'Update Employees',           module: 'employees',  action: 'update' },
  { name: 'employees:delete',         displayName: 'Remove Employees',           module: 'employees',  action: 'delete' },
  // Attendance
  { name: 'attendance:view',          displayName: 'View Attendance',            module: 'attendance', action: 'view' },
  { name: 'attendance:manage',        displayName: 'Manage Attendance',          module: 'attendance', action: 'manage' },
  // Leave
  { name: 'leave:apply',              displayName: 'Apply for Leave',            module: 'leave',      action: 'apply' },
  { name: 'leave:approve',            displayName: 'Approve Leave',              module: 'leave',      action: 'approve' },
  // Payroll
  { name: 'payroll:view',             displayName: 'View Payroll',               module: 'payroll',    action: 'view' },
  { name: 'payroll:manage',           displayName: 'Manage Payroll',             module: 'payroll',    action: 'manage' },
  // Reports
  { name: 'reports:view',             displayName: 'View Reports',               module: 'reports',    action: 'view' },
  { name: 'reports:export',           displayName: 'Export Reports',             module: 'reports',    action: 'export' },
  // Audit
  { name: 'audit:view',               displayName: 'View Audit Logs',            module: 'audit',      action: 'view' },
  // Backup
  { name: 'backup:manage',            displayName: 'Manage Backups',             module: 'backup',     action: 'manage' },
];

// ─── DEPARTMENTS ─────────────────────────────────────────────────
const DEPARTMENTS = [
  { name: 'Administration & Finance', code: 'ADM' },
  { name: 'Medical Director Office',  code: 'MDO' },
  { name: 'Reception',                code: 'REC' },
  { name: 'General OPD',              code: 'OPD' },
  { name: 'Internal Medicine',        code: 'MED' },
  { name: 'Surgery',                  code: 'SUR' },
  { name: 'Gynecology',               code: 'GYN' },
  { name: 'Pediatrics',               code: 'PED' },
  { name: 'Physiotherapy',            code: 'PHY' },
  { name: 'Eye Clinic',               code: 'EYE' },
  { name: 'Laboratory',               code: 'LAB' },
  { name: 'Pharmacy',                 code: 'PHA' },
  { name: 'Operation Room',           code: 'OPR' },
  { name: 'Delivery',                 code: 'DEL' },
  { name: 'Medical Ward',             code: 'MWD' },
  { name: 'Surgical Ward',            code: 'SWD' },
  { name: 'Maternity Ward',           code: 'MNT' },
  { name: 'Pediatric Ward',           code: 'PWD' },
  { name: 'ICU',                      code: 'ICU' },
  { name: 'Maintenance',              code: 'MNT' },
  { name: 'Security',                 code: 'SEC' },
  { name: 'Sanitation',               code: 'SAN' },
  { name: 'Property Management',      code: 'PRP' },
  { name: 'Purchasing',               code: 'PUR' },
  { name: 'Canteen',                  code: 'CAN' },
  { name: 'Human Resources',          code: 'HRD' },
  { name: 'Store',                    code: 'STR' },
];

// ─── WARDS ────────────────────────────────────────────────────────
const WARDS = [
  { name: 'Medical Ward A',    code: 'MW-A', type: 'MEDICAL',    floor: 1, totalBeds: 20 },
  { name: 'Medical Ward B',    code: 'MW-B', type: 'MEDICAL',    floor: 2, totalBeds: 20 },
  { name: 'Surgical Ward A',   code: 'SW-A', type: 'SURGICAL',   floor: 2, totalBeds: 15 },
  { name: 'Surgical Ward B',   code: 'SW-B', type: 'SURGICAL',   floor: 3, totalBeds: 15 },
  { name: 'Maternity Ward',    code: 'MAT',  type: 'MATERNITY',  floor: 1, totalBeds: 10 },
  { name: 'Pediatric Ward',    code: 'PED',  type: 'PEDIATRIC',  floor: 1, totalBeds: 12 },
  { name: 'ICU',               code: 'ICU',  type: 'ICU',        floor: 3, totalBeds: 6  },
  { name: 'Emergency Ward',    code: 'EMG',  type: 'EMERGENCY',  floor: 0, totalBeds: 8  },
];

// ─── SERVICE TYPES ────────────────────────────────────────────────
const SERVICE_TYPES = [
  { name: 'OPD Consultation',         price: 150,   category: 'CONSULTATION' },
  { name: 'Specialist Consultation',  price: 300,   category: 'CONSULTATION' },
  { name: 'Emergency Consultation',   price: 500,   category: 'CONSULTATION' },
  { name: 'Ward Admission (per day)', price: 800,   category: 'ADMISSION' },
  { name: 'ICU (per day)',            price: 2500,  category: 'ADMISSION' },
  { name: 'Normal Delivery',          price: 3000,  category: 'DELIVERY' },
  { name: 'C-Section',                price: 8000,  category: 'OPERATION' },
  { name: 'Minor Surgery',            price: 5000,  category: 'OPERATION' },
  { name: 'Major Surgery',            price: 15000, category: 'OPERATION' },
  { name: 'X-Ray',                    price: 400,   category: 'RADIOLOGY' },
  { name: 'Ultrasound',               price: 600,   category: 'RADIOLOGY' },
  { name: 'ECG',                      price: 300,   category: 'DIAGNOSTIC' },
  { name: 'Dressing / Wound Care',    price: 100,   category: 'PROCEDURE' },
  { name: 'IV Infusion',              price: 200,   category: 'PROCEDURE' },
  { name: 'Vaccination',              price: 150,   category: 'PROCEDURE' },
];

// ─── LAB TEST CATALOG ────────────────────────────────────────────
const LAB_TESTS = [
  // HEMATOLOGY
  { testCode: 'H-001',  testName: 'CBC (Complete Blood Count)',  category: 'HEMATOLOGY',   price: 120, turnaround: 4,  normalRange: 'See report',            unit: '' },
  { testCode: 'H-002',  testName: 'WBC',                         category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: '4.5–11.0 x10³/μL',     unit: 'x10³/μL' },
  { testCode: 'H-003',  testName: 'Diff N....% L....%',          category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: 'N:50-70% L:20-40%',    unit: '%' },
  { testCode: 'H-004',  testName: 'B....% M....%',               category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: 'B:0-1% M:2-8%',        unit: '%' },
  { testCode: 'H-005',  testName: 'Hgb (Hemoglobin)',            category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: 'M:13.5-17.5 F:12-15.5 g/dL', unit: 'g/dL' },
  { testCode: 'H-006',  testName: 'Hct (Hematocrit)',            category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: 'M:41-53% F:36-46%',    unit: '%' },
  { testCode: 'H-007',  testName: 'ESR',                         category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: 'M:<15 F:<20 mm/hr',     unit: 'mm/hr' },
  { testCode: 'H-008',  testName: 'Platelets',                   category: 'HEMATOLOGY',   price: 60,  turnaround: 2,  normalRange: '150–400 x10³/μL',      unit: 'x10³/μL' },
  { testCode: 'H-009',  testName: 'Blood Group & Rh',            category: 'HEMATOLOGY',   price: 80,  turnaround: 2,  normalRange: 'A/B/AB/O',              unit: '' },
  { testCode: 'H-010',  testName: 'Hgb A1c',                     category: 'HEMATOLOGY',   price: 200, turnaround: 4,  normalRange: '<5.7%',                 unit: '%' },
  { testCode: 'H-011',  testName: 'Blood Film / Malaria',        category: 'HEMATOLOGY',   price: 100, turnaround: 2,  normalRange: 'Negative',              unit: '' },
  { testCode: 'H-012',  testName: 'Peripheral Morphology',       category: 'HEMATOLOGY',   price: 100, turnaround: 4,  normalRange: 'Normal morphology',     unit: '' },

  // STOOL TEST
  { testCode: 'ST-001', testName: 'O/P (Ova & Parasites)',       category: 'STOOL TEST',   price: 80,  turnaround: 2,  normalRange: 'No ova/cysts',          unit: '' },
  { testCode: 'ST-002', testName: 'H.Pylori (Stool)',            category: 'STOOL TEST',   price: 150, turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'ST-003', testName: 'Concentration',               category: 'STOOL TEST',   price: 80,  turnaround: 2,  normalRange: 'No organisms',          unit: '' },
  { testCode: 'ST-004', testName: 'Consistency',                 category: 'STOOL TEST',   price: 60,  turnaround: 1,  normalRange: 'Formed',                unit: '' },
  { testCode: 'ST-005', testName: 'Occult Blood',                category: 'STOOL TEST',   price: 100, turnaround: 1,  normalRange: 'Negative',              unit: '' },

  // URINALYSIS
  { testCode: 'U-001',  testName: 'Color',                       category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Yellow/Pale yellow',    unit: '' },
  { testCode: 'U-002',  testName: 'Appearance',                  category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Clear',                 unit: '' },
  { testCode: 'U-003',  testName: 'pH',                          category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: '4.5–8.0',               unit: '' },
  { testCode: 'U-004',  testName: 'SG (Specific Gravity)',       category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: '1.001–1.035',           unit: '' },
  { testCode: 'U-005',  testName: 'Protein',                     category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-006',  testName: 'Glucose',                     category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-007',  testName: 'Ketones',                     category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-008',  testName: 'Bilirubin',                   category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-009',  testName: 'Urobilinogen',                category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Normal',                unit: '' },
  { testCode: 'U-010',  testName: 'Blood',                       category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-011',  testName: 'Leukocyte',                   category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },
  { testCode: 'U-012',  testName: 'Nitrate',                     category: 'URINALYSIS',   price: 40,  turnaround: 1,  normalRange: 'Negative',              unit: '' },

  // MICROSCOPY
  { testCode: 'M-001',  testName: 'Epithelial Cells',            category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: 'Few',                   unit: '/hpf' },
  { testCode: 'M-002',  testName: 'WBC (Microscopy)',            category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: '0–5/hpf',               unit: '/hpf' },
  { testCode: 'M-003',  testName: 'RBC (Microscopy)',            category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: '0–2/hpf',               unit: '/hpf' },
  { testCode: 'M-004',  testName: 'Casts',                       category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: 'None',                  unit: '' },
  { testCode: 'M-005',  testName: 'Crystals',                    category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: 'None/Few',              unit: '' },
  { testCode: 'M-006',  testName: 'Bacteria',                    category: 'MICROSCOPY',   price: 60,  turnaround: 2,  normalRange: 'None',                  unit: '' },

  // SEROLOGY
  { testCode: 'S-001',  testName: 'VDRL/RPR',                    category: 'SEROLOGY',     price: 100, turnaround: 2,  normalRange: 'Non-reactive',          unit: '' },
  { testCode: 'S-002',  testName: 'WIDAL/H/Typhoid',             category: 'SEROLOGY',     price: 120, turnaround: 3,  normalRange: '<1:80',                 unit: '' },
  { testCode: 'S-003',  testName: 'WIDAL O',                     category: 'SEROLOGY',     price: 100, turnaround: 3,  normalRange: '<1:80',                 unit: '' },
  { testCode: 'S-004',  testName: 'HBsAg',                       category: 'SEROLOGY',     price: 150, turnaround: 2,  normalRange: 'Negative',              unit: '' },
  { testCode: 'S-005',  testName: 'HCV Ab',                      category: 'SEROLOGY',     price: 150, turnaround: 2,  normalRange: 'Negative',              unit: '' },
  { testCode: 'S-006',  testName: 'ASO',                         category: 'SEROLOGY',     price: 150, turnaround: 3,  normalRange: '<200 IU/mL',            unit: 'IU/mL' },
  { testCode: 'S-007',  testName: 'CRP',                         category: 'SEROLOGY',     price: 200, turnaround: 3,  normalRange: '<6 mg/L',               unit: 'mg/L' },
  { testCode: 'S-008',  testName: 'Rheumatoid Factor',           category: 'SEROLOGY',     price: 150, turnaround: 3,  normalRange: '<20 IU/mL',             unit: 'IU/mL' },
  { testCode: 'S-009',  testName: 'PHCT (HIV)',                  category: 'SEROLOGY',     price: 100, turnaround: 1,  normalRange: 'Non-reactive',          unit: '' },
  { testCode: 'S-010',  testName: 'HP Color (Serum)',            category: 'SEROLOGY',     price: 150, turnaround: 2,  normalRange: 'Negative',              unit: '' },

  // BACTERIOLOGY
  { testCode: 'B-001',  testName: 'Sample (Bacteriology)',       category: 'BACTERIOLOGY', price: 100, turnaround: 24, normalRange: 'No growth',             unit: '' },
  { testCode: 'B-002',  testName: 'KOH',                         category: 'BACTERIOLOGY', price: 100, turnaround: 4,  normalRange: 'No fungal elements',    unit: '' },
  { testCode: 'B-003',  testName: 'Gram Stain',                  category: 'BACTERIOLOGY', price: 100, turnaround: 4,  normalRange: 'No organisms',          unit: '' },
  { testCode: 'B-004',  testName: 'Wet Film',                    category: 'BACTERIOLOGY', price: 100, turnaround: 2,  normalRange: 'No organisms',          unit: '' },
  { testCode: 'B-005',  testName: 'AFB',                         category: 'BACTERIOLOGY', price: 150, turnaround: 24, normalRange: 'No AFB seen',           unit: '' },
  { testCode: 'B-006',  testName: 'Culture',                     category: 'BACTERIOLOGY', price: 400, turnaround: 72, normalRange: 'No growth',             unit: '' },

  // CHEMISTRY
  { testCode: 'C-001',  testName: 'FBS/RBS',                     category: 'CHEMISTRY',    price: 60,  turnaround: 1,  normalRange: '70–140 mg/dl',          unit: 'mg/dl' },
  { testCode: 'C-002',  testName: 'SGOT',                        category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '13–46 u/l',             unit: 'u/l' },
  { testCode: 'C-003',  testName: 'SGPT',                        category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '10–56 u/l',             unit: 'u/l' },
  { testCode: 'C-004',  testName: 'Alkaline Phosphatase',        category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '45–150 u/l',            unit: 'u/l' },
  { testCode: 'C-005',  testName: 'Bilirubin (Total)',           category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '0.3–1.9 mg/dl',         unit: 'mg/dl' },
  { testCode: 'C-006',  testName: 'Bilirubin (Direct)',          category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '0.0–0.3 mg/dl',         unit: 'mg/dl' },
  { testCode: 'C-007',  testName: 'Urea',                        category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '15–40 mg/dl',           unit: 'mg/dl' },
  { testCode: 'C-008',  testName: 'Creatinine',                  category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '0.70–1.20 mg/dl',       unit: 'mg/dl' },
  { testCode: 'C-009',  testName: 'Uric Acid',                   category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '2.2–7.2 mg/dl',         unit: 'mg/dl' },
  { testCode: 'C-010',  testName: 'Total Protein',               category: 'CHEMISTRY',    price: 100, turnaround: 4,  normalRange: '6.6–8.9 mg/dl',         unit: 'mg/dl' },

  // LIPID PROFILE
  { testCode: 'L-001',  testName: 'Cholesterol Total',           category: 'LIPID PROFILE',price: 100, turnaround: 4,  normalRange: '<150 mg/dl',            unit: 'mg/dl' },
  { testCode: 'L-002',  testName: 'Triglycerol Total',           category: 'LIPID PROFILE',price: 100, turnaround: 4,  normalRange: '<200 mg/dl',            unit: 'mg/dl' },
  { testCode: 'L-003',  testName: 'HDL-C',                       category: 'LIPID PROFILE',price: 100, turnaround: 4,  normalRange: '>55 mg/dl',             unit: 'mg/dl' },
  { testCode: 'L-004',  testName: 'LDL-C',                       category: 'LIPID PROFILE',price: 100, turnaround: 4,  normalRange: '<220 mg/dl',            unit: 'mg/dl' },
  { testCode: 'L-005',  testName: 'LDH',                         category: 'LIPID PROFILE',price: 100, turnaround: 4,  normalRange: '56–194 u/l',            unit: 'u/l' },

  // ELECTROLYTES
  { testCode: 'E-001',  testName: 'Sodium (Na)',                 category: 'ELECTROLYTES', price: 100, turnaround: 4,  normalRange: '136–146 mmol/l',        unit: 'mmol/l' },
  { testCode: 'E-002',  testName: 'Potassium (K)',               category: 'ELECTROLYTES', price: 100, turnaround: 4,  normalRange: '3.5–5.5 mEq/l',        unit: 'mEq/l' },
  { testCode: 'E-003',  testName: 'Calcium (Ca)',                category: 'ELECTROLYTES', price: 100, turnaround: 4,  normalRange: '8.4–10.2 mg/dl',        unit: 'mg/dl' },
  { testCode: 'E-004',  testName: 'Cancer Marker',               category: 'ELECTROLYTES', price: 500, turnaround: 24, normalRange: 'See report',            unit: '' },
  { testCode: 'E-005',  testName: 'Vitamin D',                   category: 'ELECTROLYTES', price: 400, turnaround: 24, normalRange: '20–50 ng/mL',           unit: 'ng/mL' },

  // HCOG TEST
  { testCode: 'T-001',  testName: 'T3',                          category: 'HCOG TEST',    price: 200, turnaround: 24, normalRange: '1.3–46 u/l',            unit: 'u/l' },
  { testCode: 'T-002',  testName: 'T4',                          category: 'HCOG TEST',    price: 200, turnaround: 24, normalRange: '10–56 u/l',             unit: 'u/l' },
  { testCode: 'T-003',  testName: 'TSH',                         category: 'HCOG TEST',    price: 250, turnaround: 24, normalRange: '45–150 u/l',            unit: 'u/l' },

  // COAGULATION
  { testCode: 'COA-001',testName: 'PT (Prothrombin Time)',       category: 'COAGULATION',  price: 150, turnaround: 4,  normalRange: '11–13 seconds',         unit: 'sec' },
  { testCode: 'COA-002',testName: 'PTT',                         category: 'COAGULATION',  price: 150, turnaround: 4,  normalRange: '25–35 seconds',         unit: 'sec' },
  { testCode: 'COA-003',testName: 'INR',                         category: 'COAGULATION',  price: 150, turnaround: 4,  normalRange: '0.8–1.2',               unit: '' },
];

// ─── DRUGS ───────────────────────────────────────────────────────
const DRUGS = [
  { drugCode: 'DRG-001', genericName: 'Amoxicillin',           brandName: 'Amoxil',      category: 'ANTIBIOTIC',     form: 'Capsule',  strength: '500mg', unit: 'capsule', unitPrice: 5   },
  { drugCode: 'DRG-002', genericName: 'Paracetamol',           brandName: 'Panadol',     category: 'ANALGESIC',      form: 'Tablet',   strength: '500mg', unit: 'tablet',  unitPrice: 1   },
  { drugCode: 'DRG-003', genericName: 'Ibuprofen',             brandName: 'Brufen',      category: 'NSAID',          form: 'Tablet',   strength: '400mg', unit: 'tablet',  unitPrice: 3   },
  { drugCode: 'DRG-004', genericName: 'Metformin',             brandName: 'Glucophage',  category: 'ANTIDIABETIC',   form: 'Tablet',   strength: '500mg', unit: 'tablet',  unitPrice: 4   },
  { drugCode: 'DRG-005', genericName: 'Amlodipine',            brandName: 'Norvasc',     category: 'ANTIHYPERTENSIVE',form: 'Tablet',  strength: '5mg',   unit: 'tablet',  unitPrice: 6   },
  { drugCode: 'DRG-006', genericName: 'Omeprazole',            brandName: 'Losec',       category: 'PPI',            form: 'Capsule',  strength: '20mg',  unit: 'capsule', unitPrice: 8   },
  { drugCode: 'DRG-007', genericName: 'Ciprofloxacin',         brandName: 'Cipro',       category: 'ANTIBIOTIC',     form: 'Tablet',   strength: '500mg', unit: 'tablet',  unitPrice: 10  },
  { drugCode: 'DRG-008', genericName: 'Artesunate + Amodiaquine', brandName: 'Coarsucam', category: 'ANTIMALARIAL',  form: 'Tablet',   strength: 'AS/AQ', unit: 'tablet',  unitPrice: 15  },
  { drugCode: 'DRG-009', genericName: 'ORS',                   brandName: 'ORS Sachet',  category: 'REHYDRATION',    form: 'Sachet',   strength: '27.9g', unit: 'sachet',  unitPrice: 5   },
  { drugCode: 'DRG-010', genericName: 'Dexamethasone',         brandName: 'Decadron',    category: 'STEROID',        form: 'Injection',strength: '4mg',   unit: 'vial',    unitPrice: 20  },
  { drugCode: 'DRG-011', genericName: 'Oxytocin',              brandName: 'Syntocinon',  category: 'HORMONE',        form: 'Injection',strength: '10IU',  unit: 'ampoule', unitPrice: 30  },
  { drugCode: 'DRG-012', genericName: 'Diazepam',              brandName: 'Valium',      category: 'ANXIOLYTIC',     form: 'Tablet',   strength: '5mg',   unit: 'tablet',  unitPrice: 7   },
  { drugCode: 'DRG-013', genericName: 'Ringer Lactate',        brandName: 'RL',          category: 'IV_FLUID',       form: 'Infusion', strength: '500ml', unit: 'bag',     unitPrice: 50  },
  { drugCode: 'DRG-014', genericName: 'Normal Saline 0.9%',   brandName: 'NS',          category: 'IV_FLUID',       form: 'Infusion', strength: '500ml', unit: 'bag',     unitPrice: 45  },
  { drugCode: 'DRG-015', genericName: 'Metronidazole',         brandName: 'Flagyl',      category: 'ANTIBIOTIC',     form: 'Tablet',   strength: '400mg', unit: 'tablet',  unitPrice: 3   },
  { drugCode: 'DRG-016', genericName: 'Atorvastatin',          brandName: 'Lipitor',     category: 'STATIN',         form: 'Tablet',   strength: '20mg',  unit: 'tablet',  unitPrice: 12  },
  { drugCode: 'DRG-017', genericName: 'Ceftriaxone',           brandName: 'Rocephin',    category: 'ANTIBIOTIC',     form: 'Injection',strength: '1g',    unit: 'vial',    unitPrice: 80  },
  { drugCode: 'DRG-018', genericName: 'Morphine Sulfate',      brandName: 'MS Contin',   category: 'OPIOID',         form: 'Injection',strength: '10mg',  unit: 'ampoule', unitPrice: 120, requiresPrescription: true },
  { drugCode: 'DRG-019', genericName: 'Insulin Regular',       brandName: 'Actrapid',    category: 'ANTIDIABETIC',   form: 'Injection',strength: '100IU/ml', unit: 'vial', unitPrice: 250 },
  { drugCode: 'DRG-020', genericName: 'Salbutamol',            brandName: 'Ventolin',    category: 'BRONCHODILATOR', form: 'Inhaler',  strength: '100mcg', unit: 'inhaler', unitPrice: 90 },
];

// ─── INVENTORY CATEGORIES & ITEMS ────────────────────────────────
const INVENTORY_CATEGORIES = [
  { name: 'Surgical Supplies' },
  { name: 'Consumables' },
  { name: 'Medical Equipment' },
  { name: 'Office Supplies' },
  { name: 'Cleaning Supplies' },
  { name: 'PPE' },
];

const INVENTORY_ITEMS = [
  { itemCode: 'INV-001', name: 'Surgical Gloves (Box)',       category: 'Surgical Supplies', unit: 'box',   quantity: 200, reorderLevel: 50, unitCost: 80  },
  { itemCode: 'INV-002', name: 'Surgical Mask (Box)',         category: 'PPE',               unit: 'box',   quantity: 300, reorderLevel: 100, unitCost: 60 },
  { itemCode: 'INV-003', name: 'Syringe 5ml',                 category: 'Consumables',       unit: 'piece', quantity: 1000, reorderLevel: 200, unitCost: 2 },
  { itemCode: 'INV-004', name: 'Syringe 10ml',                category: 'Consumables',       unit: 'piece', quantity: 800, reorderLevel: 200, unitCost: 3  },
  { itemCode: 'INV-005', name: 'IV Cannula 18G',              category: 'Consumables',       unit: 'piece', quantity: 500, reorderLevel: 100, unitCost: 15 },
  { itemCode: 'INV-006', name: 'Gauze Bandage Roll',          category: 'Surgical Supplies', unit: 'piece', quantity: 600, reorderLevel: 150, unitCost: 10 },
  { itemCode: 'INV-007', name: 'Cotton Wool 500g',            category: 'Surgical Supplies', unit: 'pack',  quantity: 100, reorderLevel: 30,  unitCost: 45 },
  { itemCode: 'INV-008', name: 'Stethoscope',                 category: 'Medical Equipment', unit: 'piece', quantity: 20,  reorderLevel: 5,   unitCost: 500 },
  { itemCode: 'INV-009', name: 'Blood Pressure Monitor',      category: 'Medical Equipment', unit: 'piece', quantity: 15,  reorderLevel: 3,   unitCost: 1200 },
  { itemCode: 'INV-010', name: 'Thermometer (Digital)',       category: 'Medical Equipment', unit: 'piece', quantity: 30,  reorderLevel: 10,  unitCost: 150 },
  { itemCode: 'INV-011', name: 'Alcohol Swabs (Box)',         category: 'Consumables',       unit: 'box',   quantity: 400, reorderLevel: 100, unitCost: 25 },
  { itemCode: 'INV-012', name: 'Urine Bag',                   category: 'Consumables',       unit: 'piece', quantity: 200, reorderLevel: 50,  unitCost: 30 },
  { itemCode: 'INV-013', name: 'Foley Catheter',              category: 'Consumables',       unit: 'piece', quantity: 100, reorderLevel: 30,  unitCost: 60 },
  { itemCode: 'INV-014', name: 'Nasogastric Tube',            category: 'Consumables',       unit: 'piece', quantity: 80,  reorderLevel: 20,  unitCost: 45 },
  { itemCode: 'INV-015', name: 'Oxygen Mask',                 category: 'Consumables',       unit: 'piece', quantity: 120, reorderLevel: 40,  unitCost: 35 },
];

// ─── OPERATION ROOMS ─────────────────────────────────────────────
const OPERATION_ROOMS = [
  { name: 'Operation Theater 1', code: 'OT-1', type: 'MAJOR' },
  { name: 'Operation Theater 2', code: 'OT-2', type: 'MAJOR' },
  { name: 'Minor OT',            code: 'MOT',  type: 'MINOR' },
  { name: 'Delivery Room 1',     code: 'DR-1', type: 'DELIVERY' },
  { name: 'Delivery Room 2',     code: 'DR-2', type: 'DELIVERY' },
];

// ─── LEAVE TYPES ─────────────────────────────────────────────────
const LEAVE_TYPES = [
  { name: 'Annual Leave',     daysAllowed: 21, isPaid: true },
  { name: 'Sick Leave',       daysAllowed: 14, isPaid: true },
  { name: 'Maternity Leave',  daysAllowed: 90, isPaid: true },
  { name: 'Paternity Leave',  daysAllowed: 5,  isPaid: true },
  { name: 'Emergency Leave',  daysAllowed: 5,  isPaid: true },
  { name: 'Unpaid Leave',     daysAllowed: 30, isPaid: false },
];

// ─── INSURANCE PROVIDERS ─────────────────────────────────────────
const INSURANCE_PROVIDERS = [
  { name: 'Ethiopian Insurance Corporation',  code: 'EIC',   contactPhone: '+251111234567' },
  { name: 'Nyala Insurance Share Company',    code: 'NISC',  contactPhone: '+251117654321' },
  { name: 'CBHI (Community Based)',           code: 'CBHI',  contactPhone: '+251119876543' },
  { name: 'Awash Insurance Company',          code: 'AWC',   contactPhone: '+251113456789' },
  { name: 'National Insurance Share Company', code: 'NISCO', contactPhone: '+251112345678' },
];

// ─── ROLE → PERMISSION MAPPING ───────────────────────────────────
const ALL_PERMISSIONS = PERMISSIONS.map(p => p.name);

const ROLE_PERMISSIONS = {
  CEO:               ALL_PERMISSIONS,
  ADMIN_FINANCE:     ALL_PERMISSIONS.filter(p => !p.startsWith('opd:diagnose') && !p.startsWith('opd:prescribe')),
  MEDICAL_DIRECTOR:  ALL_PERMISSIONS,
  MEDICAL_SUPERVISOR: ALL_PERMISSIONS,
  RECEPTION_HEAD:    ['dashboard:view','patients:view','patients:create','patients:update','appointments:view','appointments:create','appointments:update','queue:view','billing:view','billing:create','reports:view'],
  LAB_HEAD:          ['dashboard:view','patients:view','lab:view','lab:create','lab:enter_results','lab:approve','lab:manage_catalog','reports:view','reports:export'],
  PHARMACY_HEAD:     ['dashboard:view','patients:view','opd:view','pharmacy:view','pharmacy:dispense','pharmacy:manage_drugs','pharmacy:manage_stock','inventory:view','inventory:manage','reports:view'],
  OR_HEAD:           ['dashboard:view','patients:view','or:view','or:schedule','or:update','admissions:view','reports:view'],
  DELIVERY_HEAD:     ['dashboard:view','patients:view','delivery:view','delivery:create','delivery:update','admissions:view','reports:view'],
  MATRON:            ['dashboard:view','patients:view','triage:view','triage:create','triage:update','admissions:view','admissions:create','admissions:discharge','wards:manage','beds:manage','nursing:view'],
  OPD_HEAD:          ['dashboard:view','patients:view','opd:view','opd:create','opd:diagnose','opd:prescribe','triage:view','appointments:view','reports:view'],
  WARD_HEAD:         ['dashboard:view','patients:view','admissions:view','admissions:create','admissions:discharge','wards:manage','beds:manage','nursing:view'],
  DOCTOR:            ['dashboard:view','patients:view','opd:view','opd:create','opd:diagnose','opd:prescribe','lab:view','lab:create','triage:view','admissions:view','admissions:create','or:view','or:schedule','delivery:view','delivery:create','pharmacy:view','employees:view'],
  NURSE:             ['dashboard:view','patients:view','triage:view','triage:create','triage:update','opd:view','admissions:view','beds:manage','nursing:view'],
  CASHIER:           ['dashboard:view','billing:view','billing:create','billing:update','billing:finalize','payments:receive','payments:refund','patients:view','insurance:view'],
  LAB_TECHNICIAN:    ['dashboard:view','patients:view','lab:view','lab:enter_results','lab:approve'],
  PHARMACIST:        ['dashboard:view','patients:view','pharmacy:view','pharmacy:dispense','pharmacy:manage_stock'],
  HR_OFFICER:        ['dashboard:view','employees:view','employees:create','employees:update','attendance:view','attendance:manage','leave:apply','leave:approve','payroll:view','payroll:manage','reports:view'],
  STORE_MANAGER:     ['dashboard:view','inventory:view','inventory:manage','pharmacy:manage_stock'],
  GENERAL_SERVICE:   ['dashboard:view','employees:view','inventory:view','reports:view'],
  PURCHASE_OFFICER:  ['dashboard:view','inventory:view','inventory:manage'],
  CANTEEN_OFFICER:   ['dashboard:view'],
  PROMOTION_OFFICER: ['dashboard:view'],
  MAINTENANCE_HEAD:  ['dashboard:view','inventory:view'],
  SECURITY_HEAD:     ['dashboard:view'],
  SANITATION_HEAD:   ['dashboard:view'],
  PROPERTY_HEAD:     ['dashboard:view','inventory:view'],
};

// ─── MAIN SEED FUNCTION ──────────────────────────────────────────
async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Roles
  console.log('→ Seeding roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName },
      create: role,
    });
  }
  console.log(`  ✓ ${ROLES.length} roles seeded`);

  // 2. Permissions
  console.log('→ Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { displayName: perm.displayName },
      create: perm,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions seeded`);

  // 3. Role-Permission assignments
  console.log('→ Assigning permissions to roles...');
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permName of perms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log('  ✓ Role permissions assigned');

  // 4. Default Users (Admin + one per role)
  console.log('→ Seeding default users...');

  const DEFAULT_USERS = [
    { username: 'superadmin',    email: 'admin@yfmhospital.com',       password: 'Admin@123456',    role: 'CEO'                },
    { username: 'admin.finance', email: 'finance@yfmhospital.com',     password: 'Finance@123456',  role: 'ADMIN_FINANCE'      },
    { username: 'med.director',  email: 'director@yfmhospital.com',    password: 'Director@123456', role: 'MEDICAL_DIRECTOR'   },
    { username: 'med.supervisor',email: 'supervisor@yfmhospital.com',  password: 'Supervisor@1234', role: 'MEDICAL_SUPERVISOR' },
    { username: 'reception.head',email: 'reception@yfmhospital.com',   password: 'Reception@1234',  role: 'RECEPTION_HEAD'     },
    { username: 'lab.head',      email: 'labhead@yfmhospital.com',     password: 'LabHead@1234',    role: 'LAB_HEAD'           },
    { username: 'pharmacy.head', email: 'pharmacy@yfmhospital.com',    password: 'Pharmacy@1234',   role: 'PHARMACY_HEAD'      },
    { username: 'or.head',       email: 'orhead@yfmhospital.com',      password: 'OrHead@12345',    role: 'OR_HEAD'            },
    { username: 'delivery.head', email: 'delivery@yfmhospital.com',    password: 'Delivery@1234',   role: 'DELIVERY_HEAD'      },
    { username: 'matron',        email: 'matron@yfmhospital.com',      password: 'Matron@12345',    role: 'MATRON'             },
    { username: 'opd.head',      email: 'opd@yfmhospital.com',         password: 'Opd@123456',      role: 'OPD_HEAD'           },
    { username: 'ward.head',     email: 'ward@yfmhospital.com',        password: 'Ward@123456',     role: 'WARD_HEAD'          },
    { username: 'doctor1',       email: 'doctor1@yfmhospital.com',     password: 'Doctor@12345',    role: 'DOCTOR'             },
    { username: 'nurse1',        email: 'nurse1@yfmhospital.com',      password: 'Nurse@123456',    role: 'NURSE'              },
    { username: 'cashier1',      email: 'cashier@yfmhospital.com',     password: 'Cashier@1234',    role: 'CASHIER'            },
    { username: 'lab.tech1',     email: 'labtech@yfmhospital.com',     password: 'LabTech@1234',    role: 'LAB_TECHNICIAN'     },
    { username: 'pharmacist1',   email: 'pharmacist@yfmhospital.com',  password: 'Pharma@12345',    role: 'PHARMACIST'         },
    { username: 'hr.officer',    email: 'hr@yfmhospital.com',          password: 'Hr@1234567',      role: 'HR_OFFICER'         },
    { username: 'store.manager', email: 'store@yfmhospital.com',       password: 'Store@12345',     role: 'STORE_MANAGER'      },
    { username: 'general.svc',   email: 'general@yfmhospital.com',     password: 'General@1234',    role: 'GENERAL_SERVICE'    },
    { username: 'purchase',      email: 'purchase@yfmhospital.com',    password: 'Purchase@123',    role: 'PURCHASE_OFFICER'   },
    { username: 'canteen',       email: 'canteen@yfmhospital.com',     password: 'Canteen@1234',    role: 'CANTEEN_OFFICER'    },
    { username: 'promotion',     email: 'promotion@yfmhospital.com',   password: 'Promo@12345',     role: 'PROMOTION_OFFICER'  },
    { username: 'maintenance',   email: 'maintenance@yfmhospital.com', password: 'Maint@12345',     role: 'MAINTENANCE_HEAD'   },
    { username: 'security',      email: 'security@yfmhospital.com',    password: 'Security@123',    role: 'SECURITY_HEAD'      },
    { username: 'sanitation',    email: 'sanitation@yfmhospital.com',  password: 'Sanit@12345',     role: 'SANITATION_HEAD'    },
    { username: 'property',      email: 'property@yfmhospital.com',    password: 'Property@123',    role: 'PROPERTY_HEAD'      },
  ];

  for (const u of DEFAULT_USERS) {
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (!role) continue;
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: { username: u.username, email: u.email, password: hashed, roleId: role.id, isActive: true },
    });
  }
  console.log(`  ✓ ${DEFAULT_USERS.length} default users seeded`);

  // Print credentials table
  console.log('\n─────────────────────────────────────────────────────────────────────');
  console.log('DEFAULT USER CREDENTIALS');
  console.log('─────────────────────────────────────────────────────────────────────');
  console.log('Role                    │ Email                          │ Password');
  console.log('────────────────────────┼────────────────────────────────┼─────────────────');
  DEFAULT_USERS.forEach(u => {
    const role = u.role.padEnd(23);
    const email = u.email.padEnd(31);
    console.log(`${role} │ ${email} │ ${u.password}`);
  });
  console.log('─────────────────────────────────────────────────────────────────────\n');

  // 5. Departments
  console.log('→ Seeding departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
  }
  console.log(`  ✓ ${DEPARTMENTS.length} departments seeded`);

  // 6. Wards & Beds
  console.log('→ Seeding wards and beds...');
  for (const wardData of WARDS) {
    const ward = await prisma.ward.upsert({
      where: { code: wardData.code },
      update: { name: wardData.name, totalBeds: wardData.totalBeds },
      create: wardData,
    });

    // Create beds for this ward
    for (let i = 1; i <= wardData.totalBeds; i++) {
      const bedNumber = `${wardData.code}-${String(i).padStart(2, '0')}`;
      await prisma.bed.upsert({
        where: { wardId_bedNumber: { wardId: ward.id, bedNumber } },
        update: {},
        create: { wardId: ward.id, bedNumber, type: 'GENERAL', status: 'AVAILABLE' },
      });
    }
  }
  console.log(`  ✓ Wards and beds seeded`);

  // 7. Operation Rooms
  console.log('→ Seeding operation rooms...');
  for (const or of OPERATION_ROOMS) {
    await prisma.operationRoom.upsert({
      where: { code: or.code },
      update: { name: or.name },
      create: or,
    });
  }
  console.log(`  ✓ ${OPERATION_ROOMS.length} operation rooms seeded`);

  // 8. Service Types
  console.log('→ Seeding bill service types...');
  for (const svc of SERVICE_TYPES) {
    await prisma.billServiceType.upsert({
      where: { name: svc.name },
      update: { price: svc.price },
      create: svc,
    });
  }
  console.log(`  ✓ ${SERVICE_TYPES.length} service types seeded`);

  // 9. Lab Tests
  console.log('→ Seeding lab test catalog...');
  for (const test of LAB_TESTS) {
    await prisma.labTestCatalog.upsert({
      where: { testCode: test.testCode },
      update: { testName: test.testName, price: test.price },
      create: test,
    });
  }
  console.log(`  ✓ ${LAB_TESTS.length} lab tests seeded`);

  // 10. Drugs
  console.log('→ Seeding drug catalog...');
  for (const drug of DRUGS) {
    await prisma.drug.upsert({
      where: { drugCode: drug.drugCode },
      update: { genericName: drug.genericName, unitPrice: drug.unitPrice },
      create: {
        drugCode:    drug.drugCode,
        genericName: drug.genericName,
        brandName:   drug.brandName,
        category:    drug.category,
        form:        drug.form,
        strength:    drug.strength,
        unit:        drug.unit,
        unitPrice:   drug.unitPrice,
        reorderLevel: 50,
        requiresPrescription: drug.requiresPrescription ?? true,
      },
    });
  }
  console.log(`  ✓ ${DRUGS.length} drugs seeded`);

  // 11. Inventory
  console.log('→ Seeding inventory...');
  for (const cat of INVENTORY_CATEGORIES) {
    await prisma.inventoryCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  for (const item of INVENTORY_ITEMS) {
    const cat = await prisma.inventoryCategory.findUnique({ where: { name: item.category } });
    if (!cat) continue;
    await prisma.inventoryItem.upsert({
      where: { itemCode: item.itemCode },
      update: { quantity: item.quantity },
      create: {
        itemCode:     item.itemCode,
        name:         item.name,
        categoryId:   cat.id,
        unit:         item.unit,
        quantity:     item.quantity,
        reorderLevel: item.reorderLevel,
        unitCost:     item.unitCost,
      },
    });
  }
  console.log(`  ✓ Inventory seeded`);

  // 12. Leave Types
  console.log('→ Seeding leave types...');
  for (const lt of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }
  console.log(`  ✓ ${LEAVE_TYPES.length} leave types seeded`);

  // 13. Insurance Providers
  console.log('→ Seeding insurance providers...');
  for (const ip of INSURANCE_PROVIDERS) {
    await prisma.insuranceProvider.upsert({
      where: { code: ip.code },
      update: { name: ip.name },
      create: ip,
    });
  }
  console.log(`  ✓ ${INSURANCE_PROVIDERS.length} insurance providers seeded`);

  console.log('\n✅ Database seeded successfully!');
  console.log('─────────────────────────────────────────');
  console.log('Primary Admin Login:');
  console.log('  Email:    admin@yfmhospital.com');
  console.log('  Password: Admin@123456');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
