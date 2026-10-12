# SAMASENBET HOSPITAL MANAGEMENT SYSTEM

## Overview
A complete, production-ready Hospital Management System for Samasenbet Hospital built with React.js, Node.js, Express.js, MySQL, and Prisma ORM.

## Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- React Router v6
- Axios
- Chart.js / React-Chartjs-2

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL

### Authentication
- JWT (Access + Refresh Tokens)
- Role-Based Access Control (RBAC)

### File Handling
- Multer (file uploads)
- PDFKit (PDF reports)
- ExcelJS (Excel reports)

---

## Project Structure

```
samasenbet-hms/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── jobs/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/
│   ├── uploads/
│   ├── logs/
│   └── reports/
│       ├── pdf/
│       └── excel/
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── assets/
    │   ├── components/
    │   │   ├── common/
    │   │   ├── layout/
    │   │   └── charts/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── routes/
    │   ├── store/
    │   └── utils/
    └── public/
```

---

## Modules
1. Authentication
2. User Management
3. Role & Permission Management
4. Reception
5. Patient Registration
6. Appointment
7. Queue Management
8. Triage
9. OPD (General, Internal Medicine, Surgery, Gynecology, Pediatrics, Physiotherapy, Eye Clinic)
10. Laboratory
11. Pharmacy
12. Inventory
13. Billing & Payments
14. Insurance
15. Admissions & Ward Management
16. Bed Management
17. Operation Room
18. Delivery
19. Employee Management
20. Attendance & Leave Management
21. Payroll
22. Reports & Analytics
23. Dashboard
24. Notifications
25. Audit Logs
26. Backup & Restore

---

## User Roles
- CEO
- Admin / Finance Head
- General Service Head
- Medical Director
- Medical Supervisor
- Reception Head
- Laboratory Head
- Pharmacy Head
- Operation Room Head
- Delivery Head
- Matron
- General OPD Head
- Medical/Surgical Ward Head
- Maintenance Head
- Security Head
- Sanitation Head
- Property Management Head
- Purchase Officer
- Canteen Officer
- Promotion Officer
- Doctor
- Nurse
- Cashier
- Lab Technician
- Pharmacist
- Store Manager
- HR Officer

---

## Getting Started

### Prerequisites
- Node.js >= 18.x
- MySQL >= 8.x
- npm >= 9.x

### Installation
```bash
# Clone the repository
git clone <repo-url>

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Setup
- Copy `backend/.env.example` to `backend/.env` and fill in values
- Copy `frontend/.env.example` to `frontend/.env` and fill in values

### Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Running Development Servers
```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

---

## License
Proprietary — Samasenbet Hospital
