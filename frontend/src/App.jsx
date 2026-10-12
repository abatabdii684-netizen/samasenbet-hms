import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

// Layouts
import AppLayout from '@components/layout/AppLayout';
import AuthLayout from '@components/layout/AuthLayout';

// Auth pages
import LoginPage from '@pages/auth/LoginPage';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from '@pages/dashboard/DashboardPage';

// Patient
import PatientsPage from '@pages/patients/PatientsPage';
import PatientDetailPage from '@pages/patients/PatientDetailPage';
import RegisterPatientPage from '@pages/patients/RegisterPatientPage';
import EditPatientPage from '@pages/patients/EditPatientPage';

// Reception
import ReceptionOrdersPage from '@pages/reception/ReceptionOrdersPage';

// Appointments
import AppointmentsPage from '@pages/appointments/AppointmentsPage';

// Queue
import QueuePage from '@pages/queue/QueuePage';

// Triage
import TriagePage from '@pages/triage/TriagePage';

// OPD
import OPDPage from '@pages/opd/OPDPage';
import OPDVisitPage from '@pages/opd/OPDVisitPage';

// Laboratory
import LaboratoryPage from '@pages/laboratory/LaboratoryPage';
import LabOrderPage from '@pages/laboratory/LabOrderPage';

// Pharmacy
import PharmacyPage from '@pages/pharmacy/PharmacyPage';
import DrugsPage from '@pages/pharmacy/DrugsPage';

// Inventory
import InventoryPage from '@pages/inventory/InventoryPage';

// Billing
import BillingPage from '@pages/billing/BillingPage';
import BillDetailPage from '@pages/billing/BillDetailPage';

// Admissions
import AdmissionsPage from '@pages/admissions/AdmissionsPage';
import WardPage from '@pages/admissions/WardPage';
import BedManagementPage from '@pages/admissions/BedManagementPage';

// Operation Room
import OperationRoomPage from '@pages/operationRoom/OperationRoomPage';

// Delivery
import DeliveryPage from '@pages/delivery/DeliveryPage';

// Employees / HR
import EmployeesPage from '@pages/hr/EmployeesPage';
import EmployeeDetailPage from '@pages/hr/EmployeeDetailPage';
import AttendancePage from '@pages/hr/AttendancePage';
import LeavePage from '@pages/hr/LeavePage';
import PayrollPage from '@pages/hr/PayrollPage';

// Reports
import ReportsPage from '@pages/reports/ReportsPage';

// Admin
import UsersPage from '@pages/admin/UsersPage';
import RolesPage from '@pages/admin/RolesPage';
import AuditLogsPage from '@pages/admin/AuditLogsPage';
import BackupPage from '@pages/admin/BackupPage';

// Profile & Settings
import ProfilePage from '@pages/settings/ProfilePage';
import SettingsPage from '@pages/settings/SettingsPage';

// Print Templates
import PrintTemplatesPage from '@pages/print/PrintTemplatesPage';

// Notifications
import NotificationsPage from '@pages/notifications/NotificationsPage';

// Guards
import ProtectedRoute from '@components/common/ProtectedRoute';
import NotFoundPage from '@pages/NotFoundPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"           element={!isAuthenticated ? <LoginPage />          : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard"                   element={<DashboardPage />} />

        {/* Patients */}
        <Route path="/patients"                    element={<PatientsPage />} />
        <Route path="/patients/register"           element={<RegisterPatientPage />} />
        <Route path="/patients/:id/edit"           element={<EditPatientPage />} />
        <Route path="/patients/:id"                element={<PatientDetailPage />} />
        <Route path="/reception/orders"            element={<ReceptionOrdersPage />} />

        {/* Appointments */}
        <Route path="/appointments"                element={<AppointmentsPage />} />

        {/* Queue */}
        <Route path="/queue"                       element={<QueuePage />} />

        {/* Triage */}
        <Route path="/triage"                      element={<TriagePage />} />

        {/* OPD */}
        <Route path="/opd"                         element={<OPDPage />} />
        <Route path="/opd/:id"                     element={<OPDVisitPage />} />

        {/* Laboratory */}
        <Route path="/laboratory"                  element={<LaboratoryPage />} />
        <Route path="/laboratory/:id"              element={<LabOrderPage />} />

        {/* Pharmacy */}
        <Route path="/pharmacy"                    element={<PharmacyPage />} />
        <Route path="/pharmacy/drugs"              element={<DrugsPage />} />

        {/* Inventory */}
        <Route path="/inventory"                   element={<InventoryPage />} />

        {/* Billing */}
        <Route path="/billing"                     element={<BillingPage />} />
        <Route path="/billing/:id"                 element={<BillDetailPage />} />

        {/* Admissions & Wards */}
        <Route path="/admissions"                  element={<AdmissionsPage />} />
        <Route path="/wards"                       element={<WardPage />} />
        <Route path="/beds"                        element={<BedManagementPage />} />

        {/* Operation Room */}
        <Route path="/operation-room"              element={<OperationRoomPage />} />

        {/* Delivery */}
        <Route path="/delivery"                    element={<DeliveryPage />} />

        {/* HR */}
        <Route path="/employees"                   element={<EmployeesPage />} />
        <Route path="/employees/:id"               element={<EmployeeDetailPage />} />
        <Route path="/attendance"                  element={<AttendancePage />} />
        <Route path="/leave"                       element={<LeavePage />} />
        <Route path="/payroll"                     element={<PayrollPage />} />

        {/* Reports */}
        <Route path="/reports"                     element={<ReportsPage />} />

        {/* Admin */}
        <Route path="/admin/users"                 element={<UsersPage />} />
        <Route path="/admin/roles"                 element={<RolesPage />} />
        <Route path="/admin/audit-logs"            element={<AuditLogsPage />} />
        <Route path="/admin/backup"                element={<BackupPage />} />

        {/* Profile & Settings */}
        <Route path="/profile"                     element={<ProfilePage />} />
        <Route path="/settings"                    element={<SettingsPage />} />

        {/* Print Templates */}
        <Route path="/print-templates"             element={<PrintTemplatesPage />} />

        {/* Notifications */}
        <Route path="/notifications"               element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
