# HOW TO RUN — YFM General Hospital PLC HMS
## Complete Setup & Run Guide (Windows)

---

## STEP 1 — Install Prerequisites

| Software | Version | Download |
|----------|---------|---------|
| Node.js  | 18+     | https://nodejs.org |
| XAMPP    | latest  | https://www.apachefriends.org |

### Check if installed (open CMD):
```cmd
node --version
npm --version
```

---

## STEP 2 — Start XAMPP MySQL

1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Open browser → `http://localhost/phpmyadmin`
4. Click **New** → name: `samasenbet_hms` → collation: `utf8mb4_unicode_ci` → **Create**

---

## STEP 3 — Configure Database Password

Open `backend\.env` and update `DATABASE_URL`:

**If XAMPP has no password (default):**
```
DATABASE_URL="mysql://root:@localhost:3306/samasenbet_hms"
```

**If you set a password:**
```
DATABASE_URL="mysql://root:yourpassword@localhost:3306/samasenbet_hms"
```

---

## STEP 4 — Install Backend Dependencies

Open **CMD** (not PowerShell):

```cmd
cd "C:\Users\hp\Desktop\samasenbet HMS\backend"
npm install
```

---

## STEP 5 — Setup Database

Still inside the `backend` folder, run these ONE by ONE:

```cmd
npx prisma generate
```
```cmd
npx prisma migrate dev --name init
```

If you get a drift error, type `yes` when asked to reset.

```cmd
node prisma/seed/index.js
```

You should see:
```
✅ Database seeded successfully!
Primary Admin Login:
  Email:    admin@yfmhospital.com
  Password: Admin@123456
```

### ⚠️ IMPORTANT — Run these SQL patches in phpMyAdmin after migration

Go to `http://localhost/phpmyadmin` → select `samasenbet_hms` → click **SQL** tab → paste and run:

```sql
-- Allow lab orders without a visit or doctor (walk-in lab tests)
ALTER TABLE `lab_orders`
  MODIFY COLUMN `visitId` INT NULL,
  MODIFY COLUMN `doctorId` INT NULL;

-- Allow admissions without a visit (direct admission)
ALTER TABLE `admissions`
  MODIFY COLUMN `visitId` INT NULL,
  MODIFY COLUMN `admittingDoctorId` INT NULL;

-- Allow operation scheduling without a visit or surgeon
ALTER TABLE `operation_schedules`
  MODIFY COLUMN `visitId` INT NULL,
  MODIFY COLUMN `surgeonId` INT NULL;
```

After running the SQL, **stop the backend (Ctrl+C)** and run:
```cmd
cd backend
npx prisma generate
npm run dev
```

---

## STEP 6 — Install Frontend Dependencies

Open a **second CMD window**:

```cmd
cd "C:\Users\hp\Desktop\samasenbet HMS\frontend"
npm install
```
cd "C:\Users\abat\Desktop\samasenbet HMS\samasenbet HMS\frontend"
npm run dev

---

## STEP 7 — Run Both Servers

**Backend CMD window:**
```cmd
cd "C:\Users\hp\Desktop\samasenbet HMS\backend"
npm run dev
```

You should see:
```
YFM General Hospital PLC HMS API running o
n port 5000 [development]
Database connection established.
```

**Frontend CMD window:**
```cmd
cd "C:\Users\hp\Desktop\samasenbet HMS\frontend"
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

---

## STEP 8 — Open the App

Open **Chrome** → `http://localhost:5173`

**Primary Admin Login:**
| Field | Value |
|-------|-------|
| Email | admin@yfmhospital.com |
| Password | Admin@123456 |

---

## API Health Check

```
http://localhost:5000/api/v1/health
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `Access denied for user 'root'` | Wrong password in `.env` → update `DATABASE_URL` |
| `Port 5000 already in use` | Change `PORT=5001` in `backend\.env` |
| `Cannot find module` | Run `npm install` again in that folder |
| `P1001 Can't reach database` | XAMPP MySQL is not running |
| `EPERM rename .dll.node` | Backend is running — stop it with Ctrl+C first, then run the command |
| `npx not recognized` | You're in PowerShell — use CMD instead |
| Prisma migrate error | Run `npx prisma migrate reset` then seed again |

---

## Both Servers Must Stay Open

| Window | Folder | Command |
|--------|--------|---------|
| Window 1 (Backend)  | `backend/`  | `npm run dev` |
| Window 2 (Frontend) | `frontend/` | `npm run dev` |

---

## All Default User Accounts

Run `node prisma/seed/index.js` to create all users.

| Role | Email | Password |
|------|-------|---------|
| CEO / Admin | admin@yfmhospital.com | Admin@123456 |
| Admin / Finance Head | finance@yfmhospital.com | Finance@123456 |
| Medical Director | director@yfmhospital.com | Director@123456 |
| Medical Supervisor | supervisor@yfmhospital.com | Supervisor@1234 |
| Reception Head | reception@yfmhospital.com | Reception@1234 |
| Lab Head | labhead@yfmhospital.com | LabHead@1234 |
| Pharmacy Head | pharmacy@yfmhospital.com | Pharmacy@1234 |
| OR Head | orhead@yfmhospital.com | OrHead@12345 |
| Delivery Head | delivery@yfmhospital.com | Delivery@1234 |
| Matron | matron@yfmhospital.com | Matron@12345 |
| OPD Head | opd@yfmhospital.com | Opd@123456 |
| Ward Head | ward@yfmhospital.com | Ward@123456 |
| Doctor | doctor1@yfmhospital.com | Doctor@12345 |
| Nurse | nurse1@yfmhospital.com | Nurse@123456 |
| Cashier | cashier@yfmhospital.com | Cashier@1234 |
| Lab Technician | labtech@yfmhospital.com | LabTech@1234 |
| Pharmacist | pharmacist@yfmhospital.com | Pharma@12345 |
| HR Officer | hr@yfmhospital.com | Hr@1234567 |
| Store Manager | store@yfmhospital.com | Store@12345 |
| General Service | general@yfmhospital.com | General@1234 |
| Purchase Officer | purchase@yfmhospital.com | Purchase@123 |
| Canteen Officer | canteen@yfmhospital.com | Canteen@1234 |
| Promotion Officer | promotion@yfmhospital.com | Promo@12345 |
| Maintenance Head | maintenance@yfmhospital.com | Maint@12345 |
| Security Head | security@yfmhospital.com | Security@123 |
| Sanitation Head | sanitation@yfmhospital.com | Sanit@12345 |
| Property Head | property@yfmhospital.com | Property@123 |

---

## Project URLs

| Service | URL |
|---------|-----|
| Frontend (App) | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |
| Health Check | http://localhost:5000/api/v1/health |
| Prisma Studio (DB GUI) | `npx prisma studio` → http://localhost:5555 |
| phpMyAdmin | http://localhost/phpmyadmin |

---

*Yohannes Fantaye Metasebiya General Hospital PLC — HMS v1.0.0*
