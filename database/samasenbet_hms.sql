-- ═══════════════════════════════════════════════════════════════════
-- YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC
-- Complete MySQL Database Schema — All Tables (snake_case columns)
-- Drop existing DB and recreate from scratch
-- ═══════════════════════════════════════════════════════════════════

DROP DATABASE IF EXISTS samasenbet_hms;
CREATE DATABASE samasenbet_hms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE samasenbet_hms;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── TABLE 1: roles ──────────────────────────────────────────────
CREATE TABLE roles (
  id           INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description  TEXT,
  is_system    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 2: permissions ────────────────────────────────────────
CREATE TABLE permissions (
  id           INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(150) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  module       VARCHAR(100) NOT NULL,
  action       VARCHAR(50)  NOT NULL,
  description  TEXT,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_name (name),
  INDEX idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 3: role_permissions ───────────────────────────────────
CREATE TABLE role_permissions (
  id            INT      NOT NULL AUTO_INCREMENT,
  role_id       INT      NOT NULL,
  permission_id INT      NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_permission (role_id, permission_id),
  CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 4: users ──────────────────────────────────────────────
CREATE TABLE users (
  id                    INT          NOT NULL AUTO_INCREMENT,
  username              VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL,
  password              VARCHAR(255) NOT NULL,
  role_id               INT          NOT NULL,
  is_active             TINYINT(1)   NOT NULL DEFAULT 1,
  password_changed_at   DATETIME,
  password_reset_token  VARCHAR(255),
  password_reset_expiry DATETIME,
  refresh_token         TEXT,
  last_login_at         DATETIME,
  last_login_ip         VARCHAR(50),
  profile_photo         VARCHAR(500),
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email    (email),
  INDEX idx_users_role_id      (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 5: departments ────────────────────────────────────────
CREATE TABLE departments (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  head_id     INT,
  description TEXT,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name),
  UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 6: employees ──────────────────────────────────────────
CREATE TABLE employees (
  id                INT           NOT NULL AUTO_INCREMENT,
  employee_no       VARCHAR(20)   NOT NULL,
  user_id           INT           UNIQUE,
  first_name        VARCHAR(100)  NOT NULL,
  last_name         VARCHAR(100)  NOT NULL,
  gender            ENUM('MALE','FEMALE','OTHER') NOT NULL,
  date_of_birth     DATE          NOT NULL,
  national_id       VARCHAR(50)   UNIQUE,
  phone             VARCHAR(20)   NOT NULL,
  email             VARCHAR(255)  UNIQUE,
  address           TEXT,
  department_id     INT           NOT NULL,
  job_title         VARCHAR(150)  NOT NULL,
  specialization    VARCHAR(150),
  employment_type   ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERN') NOT NULL DEFAULT 'FULL_TIME',
  status            ENUM('ACTIVE','ON_LEAVE','SUSPENDED','TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  hire_date         DATE          NOT NULL,
  end_date          DATE,
  basic_salary      DECIMAL(12,2) NOT NULL,
  profile_photo     VARCHAR(500),
  license_number    VARCHAR(100),
  qualifications    TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone   VARCHAR(20),
  bank_name         VARCHAR(100),
  bank_account      VARCHAR(50),
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employee_no      (employee_no),
  INDEX idx_employees_dept       (department_id),
  INDEX idx_employees_status     (status),
  CONSTRAINT fk_emp_user FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE SET NULL,
  CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 7: patients ───────────────────────────────────────────
CREATE TABLE patients (
  id                  INT          NOT NULL AUTO_INCREMENT,
  patient_id          VARCHAR(20)  NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  date_of_birth       DATE         NOT NULL,
  gender              ENUM('MALE','FEMALE','OTHER') NOT NULL,
  blood_group         ENUM('A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  marital_status      ENUM('SINGLE','MARRIED','DIVORCED','WIDOWED') NOT NULL DEFAULT 'SINGLE',
  national_id         VARCHAR(50)  UNIQUE,
  phone               VARCHAR(20)  NOT NULL,
  email               VARCHAR(255),
  address             TEXT,
  city                VARCHAR(100),
  emergency_contact   VARCHAR(100),
  emergency_phone     VARCHAR(20),
  emergency_relation  VARCHAR(50),
  allergies           TEXT,
  chronic_diseases    TEXT,
  profile_photo       VARCHAR(500),
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  registered_by_id    INT,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patient_pid  (patient_id),
  INDEX idx_patient_phone    (phone),
  INDEX idx_patient_natid    (national_id),
  INDEX idx_patient_name     (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 8: appointments ───────────────────────────────────────
CREATE TABLE appointments (
  id             INT          NOT NULL AUTO_INCREMENT,
  appointment_no VARCHAR(20)  NOT NULL,
  patient_id     INT          NOT NULL,
  doctor_id      INT          NOT NULL,
  clinic_type    ENUM('GENERAL_OPD','INTERNAL_MEDICINE','SURGERY','GYNECOLOGY','PEDIATRICS','PHYSIOTHERAPY','EYE_CLINIC') NOT NULL,
  scheduled_at   DATETIME     NOT NULL,
  duration       INT          NOT NULL DEFAULT 15,
  status         ENUM('SCHEDULED','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
  reason         TEXT,
  notes          TEXT,
  booked_by_id   INT,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appt_no    (appointment_no),
  INDEX idx_appt_patient   (patient_id),
  INDEX idx_appt_doctor    (doctor_id),
  INDEX idx_appt_scheduled (scheduled_at),
  INDEX idx_appt_status    (status),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 9: queues ─────────────────────────────────────────────
CREATE TABLE queues (
  id           INT      NOT NULL AUTO_INCREMENT,
  queue_date   DATE     NOT NULL DEFAULT (CURRENT_DATE),
  clinic_type  ENUM('GENERAL_OPD','INTERNAL_MEDICINE','SURGERY','GYNECOLOGY','PEDIATRICS','PHYSIOTHERAPY','EYE_CLINIC') NOT NULL,
  patient_id   INT      NOT NULL,
  visit_id     INT,
  token_number INT      NOT NULL,
  priority     ENUM('IMMEDIATE','URGENT','LESS_URGENT','NON_URGENT') NOT NULL DEFAULT 'NON_URGENT',
  status       ENUM('WAITING','CALLED','IN_PROGRESS','COMPLETED','SKIPPED') NOT NULL DEFAULT 'WAITING',
  called_at    DATETIME,
  completed_at DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_queue_date_clinic (queue_date, clinic_type),
  INDEX idx_queue_patient     (patient_id),
  CONSTRAINT fk_queue_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 10: visits ────────────────────────────────────────────
CREATE TABLE visits (
  id             INT          NOT NULL AUTO_INCREMENT,
  visit_no       VARCHAR(20)  NOT NULL,
  patient_id     INT          NOT NULL,
  doctor_id      INT          NOT NULL,
  appointment_id INT          UNIQUE,
  clinic_type    ENUM('GENERAL_OPD','INTERNAL_MEDICINE','SURGERY','GYNECOLOGY','PEDIATRICS','PHYSIOTHERAPY','EYE_CLINIC') NOT NULL DEFAULT 'GENERAL_OPD',
  patient_type   ENUM('OPD','IPD','EMERGENCY') NOT NULL DEFAULT 'OPD',
  visit_date     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  present_illness TEXT,
  past_history   TEXT,
  physical_exam  TEXT,
  diagnosis      TEXT,
  icd_code       VARCHAR(20),
  treatment      TEXT,
  follow_up_date DATE,
  referred_to    VARCHAR(100),
  status         ENUM('OPEN','IN_PROGRESS','PENDING_LAB','PENDING_PHARMACY','ADMITTED','COMPLETED','REFERRED') NOT NULL DEFAULT 'OPEN',
  discharge_note TEXT,
  discharged_at  DATETIME,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visit_no          (visit_no),
  INDEX idx_visit_patient         (patient_id),
  INDEX idx_visit_doctor          (doctor_id),
  INDEX idx_visit_date            (visit_date),
  INDEX idx_visit_status          (status),
  CONSTRAINT fk_visit_patient     FOREIGN KEY (patient_id)     REFERENCES patients(id),
  CONSTRAINT fk_visit_doctor      FOREIGN KEY (doctor_id)      REFERENCES employees(id),
  CONSTRAINT fk_visit_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 11: triage_records ────────────────────────────────────
CREATE TABLE triage_records (
  id                       INT           NOT NULL AUTO_INCREMENT,
  visit_id                 INT           NOT NULL,
  patient_id               INT           NOT NULL,
  nurse_id                 INT           NOT NULL,
  temperature              DECIMAL(5,2),
  blood_pressure_systolic  INT,
  blood_pressure_diastolic INT,
  pulse_rate               INT,
  respiratory_rate         INT,
  oxygen_saturation        DECIMAL(5,2),
  weight                   DECIMAL(6,2),
  height                   DECIMAL(5,2),
  bmi                      DECIMAL(5,2),
  chief_complaint          TEXT,
  priority  ENUM('IMMEDIATE','URGENT','LESS_URGENT','NON_URGENT') NOT NULL DEFAULT 'NON_URGENT',
  notes     TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_triage_visit (visit_id),
  INDEX idx_triage_patient   (patient_id),
  CONSTRAINT fk_triage_visit   FOREIGN KEY (visit_id)   REFERENCES visits(id),
  CONSTRAINT fk_triage_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_triage_nurse   FOREIGN KEY (nurse_id)   REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 12: lab_test_catalog ──────────────────────────────────
CREATE TABLE lab_test_catalog (
  id           INT           NOT NULL AUTO_INCREMENT,
  test_code    VARCHAR(20)   NOT NULL,
  test_name    VARCHAR(200)  NOT NULL,
  category     VARCHAR(100)  NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  turnaround   INT           NOT NULL DEFAULT 24,
  description  TEXT,
  normal_range TEXT,
  unit         VARCHAR(50),
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_test_code (test_code),
  INDEX idx_test_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 13: lab_orders ────────────────────────────────────────
CREATE TABLE lab_orders (
  id                  INT          NOT NULL AUTO_INCREMENT,
  order_no            VARCHAR(20)  NOT NULL,
  visit_id            INT,
  patient_id          INT          NOT NULL,
  doctor_id           INT,
  technician_id       INT,
  status              ENUM('PENDING','SAMPLE_COLLECTED','IN_PROGRESS','COMPLETED','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  urgency             VARCHAR(20)  NOT NULL DEFAULT 'ROUTINE',
  clinical_info       TEXT,
  sample_type         VARCHAR(100),
  sample_collected_at DATETIME,
  completed_at        DATETIME,
  approved_at         DATETIME,
  approved_by_id      INT,
  notes               TEXT,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_no      (order_no),
  INDEX idx_lab_visit         (visit_id),
  INDEX idx_lab_patient       (patient_id),
  INDEX idx_lab_status        (status),
  CONSTRAINT fk_lab_visit     FOREIGN KEY (visit_id)   REFERENCES visits(id),
  CONSTRAINT fk_lab_patient   FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_lab_doctor    FOREIGN KEY (doctor_id)  REFERENCES employees(id),
  CONSTRAINT fk_lab_tech      FOREIGN KEY (technician_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 14: lab_order_items ───────────────────────────────────
CREATE TABLE lab_order_items (
  id           INT      NOT NULL AUTO_INCREMENT,
  order_id     INT      NOT NULL,
  test_id      INT      NOT NULL,
  result       TEXT,
  unit         VARCHAR(50),
  normal_range VARCHAR(100),
  is_abnormal  TINYINT(1) NOT NULL DEFAULT 0,
  remarks      TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_labitem_order FOREIGN KEY (order_id) REFERENCES lab_orders(id)      ON DELETE CASCADE,
  CONSTRAINT fk_labitem_test  FOREIGN KEY (test_id)  REFERENCES lab_test_catalog(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 15: drugs ─────────────────────────────────────────────
CREATE TABLE drugs (
  id                    INT           NOT NULL AUTO_INCREMENT,
  drug_code             VARCHAR(20)   NOT NULL,
  generic_name          VARCHAR(200)  NOT NULL,
  brand_name            VARCHAR(200),
  category              VARCHAR(100)  NOT NULL,
  form                  VARCHAR(50)   NOT NULL,
  strength              VARCHAR(50),
  unit                  VARCHAR(20)   NOT NULL,
  unit_price            DECIMAL(10,2) NOT NULL,
  reorder_level         INT           NOT NULL DEFAULT 10,
  is_active             TINYINT(1)    NOT NULL DEFAULT 1,
  requires_prescription TINYINT(1)    NOT NULL DEFAULT 1,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_drug_code   (drug_code),
  INDEX idx_drug_name       (generic_name),
  INDEX idx_drug_category   (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 16: drug_stocks ───────────────────────────────────────
CREATE TABLE drug_stocks (
  id             INT           NOT NULL AUTO_INCREMENT,
  drug_id        INT           NOT NULL,
  batch_number   VARCHAR(50)   NOT NULL,
  quantity       INT           NOT NULL,
  expiry_date    DATETIME      NOT NULL,
  supplier_id    INT,
  purchase_price DECIMAL(10,2) NOT NULL,
  received_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by_id INT,
  notes          TEXT,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_stock_drug    (drug_id),
  INDEX idx_stock_expiry  (expiry_date),
  CONSTRAINT fk_stock_drug FOREIGN KEY (drug_id) REFERENCES drugs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 17: stock_movements ───────────────────────────────────
CREATE TABLE stock_movements (
  id              INT      NOT NULL AUTO_INCREMENT,
  stock_id        INT      NOT NULL,
  type            ENUM('IN','OUT','ADJUSTMENT','EXPIRED','DAMAGED') NOT NULL,
  quantity        INT      NOT NULL,
  reference       VARCHAR(100),
  reason          TEXT,
  performed_by_id INT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_movement_stock (stock_id),
  CONSTRAINT fk_movement_stock FOREIGN KEY (stock_id) REFERENCES drug_stocks(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 18: prescriptions ─────────────────────────────────────
CREATE TABLE prescriptions (
  id              INT          NOT NULL AUTO_INCREMENT,
  prescription_no VARCHAR(20)  NOT NULL,
  visit_id        INT          NOT NULL,
  patient_id      INT          NOT NULL,
  doctor_id       INT          NOT NULL,
  pharmacist_id   INT,
  status          ENUM('PENDING','PARTIALLY_DISPENSED','DISPENSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  notes           TEXT,
  dispensed_at    DATETIME,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rx_no       (prescription_no),
  INDEX idx_rx_visit        (visit_id),
  INDEX idx_rx_patient      (patient_id),
  INDEX idx_rx_status       (status),
  CONSTRAINT fk_rx_visit     FOREIGN KEY (visit_id)   REFERENCES visits(id),
  CONSTRAINT fk_rx_patient   FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_rx_doctor    FOREIGN KEY (doctor_id)  REFERENCES employees(id),
  CONSTRAINT fk_rx_pharmacist FOREIGN KEY (pharmacist_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 19: prescription_items ────────────────────────────────
CREATE TABLE prescription_items (
  id              INT          NOT NULL AUTO_INCREMENT,
  prescription_id INT          NOT NULL,
  drug_id         INT          NOT NULL,
  dosage          VARCHAR(100) NOT NULL,
  frequency       VARCHAR(100) NOT NULL,
  duration        VARCHAR(50)  NOT NULL,
  quantity        INT          NOT NULL,
  dispensed_qty   INT          NOT NULL DEFAULT 0,
  instructions    TEXT,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_rxitem_rx   FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  CONSTRAINT fk_rxitem_drug FOREIGN KEY (drug_id)         REFERENCES drugs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 20: wards ─────────────────────────────────────────────
CREATE TABLE wards (
  id           INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  code         VARCHAR(10)  NOT NULL,
  type         VARCHAR(50)  NOT NULL,
  floor        INT          NOT NULL DEFAULT 1,
  total_beds   INT          NOT NULL DEFAULT 0,
  head_nurse_id INT,
  description  TEXT,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ward_name (name),
  UNIQUE KEY uq_ward_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 21: beds ──────────────────────────────────────────────
CREATE TABLE beds (
  id         INT         NOT NULL AUTO_INCREMENT,
  bed_number VARCHAR(20) NOT NULL,
  ward_id    INT         NOT NULL,
  type       VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  status     ENUM('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
  notes      TEXT,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bed_ward_number (ward_id, bed_number),
  INDEX idx_bed_ward_status     (ward_id, status),
  CONSTRAINT fk_bed_ward FOREIGN KEY (ward_id) REFERENCES wards(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 22: admissions ────────────────────────────────────────
CREATE TABLE admissions (
  id                  INT          NOT NULL AUTO_INCREMENT,
  admission_no        VARCHAR(20)  NOT NULL,
  patient_id          INT          NOT NULL,
  visit_id            INT          UNIQUE,
  ward_id             INT          NOT NULL,
  bed_id              INT          NOT NULL,
  admitting_doctor_id INT,
  admission_date      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_discharge  DATETIME,
  actual_discharge    DATETIME,
  discharge_note      TEXT,
  diagnosis           TEXT,
  status              ENUM('ACTIVE','DISCHARGED','TRANSFERRED','DECEASED') NOT NULL DEFAULT 'ACTIVE',
  discharged_by_id    INT,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admission_no    (admission_no),
  INDEX idx_admission_patient   (patient_id),
  INDEX idx_admission_status    (status),
  INDEX idx_admission_date      (admission_date),
  CONSTRAINT fk_adm_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_adm_visit   FOREIGN KEY (visit_id)   REFERENCES visits(id),
  CONSTRAINT fk_adm_ward    FOREIGN KEY (ward_id)    REFERENCES wards(id),
  CONSTRAINT fk_adm_bed     FOREIGN KEY (bed_id)     REFERENCES beds(id),
  CONSTRAINT fk_adm_doctor  FOREIGN KEY (admitting_doctor_id) REFERENCES employees(id),
  CONSTRAINT fk_adm_disch   FOREIGN KEY (discharged_by_id)    REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 23: nursing_notes ─────────────────────────────────────
CREATE TABLE nursing_notes (
  id           INT      NOT NULL AUTO_INCREMENT,
  admission_id INT      NOT NULL,
  nurse_id     INT      NOT NULL,
  note         TEXT     NOT NULL,
  vital_signs  TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_nursing_admission (admission_id),
  CONSTRAINT fk_nursing_adm   FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_nursing_nurse FOREIGN KEY (nurse_id)     REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 24: operation_rooms ───────────────────────────────────
CREATE TABLE operation_rooms (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(10)  NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  notes      TEXT,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oproom_name (name),
  UNIQUE KEY uq_oproom_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 25: operation_schedules ───────────────────────────────
CREATE TABLE operation_schedules (
  id                INT          NOT NULL AUTO_INCREMENT,
  schedule_no       VARCHAR(20)  NOT NULL,
  operation_room_id INT          NOT NULL,
  patient_id        INT          NOT NULL,
  visit_id          INT,
  surgeon_id        INT,
  anesthetist_id    INT,
  operation_type    VARCHAR(200) NOT NULL,
  diagnosis         TEXT,
  scheduled_at      DATETIME     NOT NULL,
  duration          INT          NOT NULL DEFAULT 60,
  status            ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','POSTPONED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  pre_op_notes      TEXT,
  post_op_notes     TEXT,
  complications     TEXT,
  started_at        DATETIME,
  completed_at      DATETIME,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schedule_no   (schedule_no),
  INDEX idx_ops_scheduled     (scheduled_at),
  INDEX idx_ops_status        (status),
  CONSTRAINT fk_ops_room      FOREIGN KEY (operation_room_id) REFERENCES operation_rooms(id),
  CONSTRAINT fk_ops_patient   FOREIGN KEY (patient_id)        REFERENCES patients(id),
  CONSTRAINT fk_ops_visit     FOREIGN KEY (visit_id)          REFERENCES visits(id),
  CONSTRAINT fk_ops_surgeon   FOREIGN KEY (surgeon_id)        REFERENCES employees(id),
  CONSTRAINT fk_ops_anesth    FOREIGN KEY (anesthetist_id)    REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 26: delivery_records ──────────────────────────────────
CREATE TABLE delivery_records (
  id                  INT           NOT NULL AUTO_INCREMENT,
  delivery_no         VARCHAR(20)   NOT NULL,
  patient_id          INT           NOT NULL,
  visit_id            INT           NOT NULL,
  attending_doctor_id INT,
  attending_nurse_id  INT,
  delivery_type       ENUM('NORMAL','CAESAREAN','ASSISTED') NOT NULL DEFAULT 'NORMAL',
  delivery_date       DATETIME      NOT NULL,
  gestation_weeks     INT,
  baby_weight         DECIMAL(5,3),
  baby_gender         ENUM('MALE','FEMALE','OTHER'),
  apgar_score         INT,
  complications       TEXT,
  notes               TEXT,
  mother_condition    VARCHAR(50),
  baby_condition      VARCHAR(50),
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_delivery_no  (delivery_no),
  INDEX idx_delivery_patient (patient_id),
  CONSTRAINT fk_del_patient FOREIGN KEY (patient_id)          REFERENCES patients(id),
  CONSTRAINT fk_del_visit   FOREIGN KEY (visit_id)            REFERENCES visits(id),
  CONSTRAINT fk_del_doctor  FOREIGN KEY (attending_doctor_id) REFERENCES employees(id),
  CONSTRAINT fk_del_nurse   FOREIGN KEY (attending_nurse_id)  REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 27: bill_service_types ────────────────────────────────
CREATE TABLE bill_service_types (
  id         INT           NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  category   VARCHAR(50)   NOT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_svc_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 28: bills ─────────────────────────────────────────────
CREATE TABLE bills (
  id            INT           NOT NULL AUTO_INCREMENT,
  bill_no       VARCHAR(20)   NOT NULL,
  patient_id    INT           NOT NULL,
  visit_id      INT           UNIQUE,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax           DECIMAL(12,2) NOT NULL DEFAULT 0,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        ENUM('DRAFT','FINALIZED','PARTIALLY_PAID','PAID','CANCELLED','REFUNDED') NOT NULL DEFAULT 'DRAFT',
  notes         TEXT,
  insurance_id  INT,
  created_by_id INT,
  finalized_at  DATETIME,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bill_no       (bill_no),
  INDEX idx_bill_patient      (patient_id),
  INDEX idx_bill_status       (status),
  INDEX idx_bill_created      (created_at),
  CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_bill_visit   FOREIGN KEY (visit_id)   REFERENCES visits(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 29: bill_items ────────────────────────────────────────
CREATE TABLE bill_items (
  id              INT           NOT NULL AUTO_INCREMENT,
  bill_id         INT           NOT NULL,
  service_type_id INT,
  lab_order_id    INT,
  prescription_id INT,
  operation_id    INT,
  delivery_id     INT,
  description     VARCHAR(300)  NOT NULL,
  quantity        INT           NOT NULL DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  total           DECIMAL(12,2) NOT NULL,
  discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_billitem_bill      (bill_id),
  CONSTRAINT fk_billitem_bill  FOREIGN KEY (bill_id)         REFERENCES bills(id)             ON DELETE CASCADE,
  CONSTRAINT fk_billitem_svc   FOREIGN KEY (service_type_id) REFERENCES bill_service_types(id),
  CONSTRAINT fk_billitem_lab   FOREIGN KEY (lab_order_id)    REFERENCES lab_orders(id),
  CONSTRAINT fk_billitem_rx    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
  CONSTRAINT fk_billitem_ops   FOREIGN KEY (operation_id)    REFERENCES operation_schedules(id),
  CONSTRAINT fk_billitem_del   FOREIGN KEY (delivery_id)     REFERENCES delivery_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 30: payments ──────────────────────────────────────────
CREATE TABLE payments (
  id             INT           NOT NULL AUTO_INCREMENT,
  payment_no     VARCHAR(20)   NOT NULL,
  bill_id        INT           NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  method         ENUM('CASH','BANK_TRANSFER','INSURANCE','MOBILE_MONEY','CHEQUE') NOT NULL DEFAULT 'CASH',
  status         ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'COMPLETED',
  reference      VARCHAR(100),
  received_by_id INT,
  notes          TEXT,
  paid_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_no (payment_no),
  INDEX idx_payment_bill   (bill_id),
  CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES bills(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 31: insurance_providers ───────────────────────────────
CREATE TABLE insurance_providers (
  id            INT          NOT NULL AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(20)  NOT NULL,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  address       TEXT,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ins_name (name),
  UNIQUE KEY uq_ins_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 32: patient_insurances ────────────────────────────────
CREATE TABLE patient_insurances (
  id            INT           NOT NULL AUTO_INCREMENT,
  patient_id    INT           NOT NULL,
  provider_id   INT           NOT NULL,
  policy_number VARCHAR(100)  NOT NULL,
  member_number VARCHAR(100),
  coverage_type VARCHAR(100),
  start_date    DATETIME      NOT NULL,
  end_date      DATETIME,
  max_coverage  DECIMAL(12,2),
  is_primary    TINYINT(1)    NOT NULL DEFAULT 1,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_patins_patient   (patient_id),
  CONSTRAINT fk_patins_patient  FOREIGN KEY (patient_id)  REFERENCES patients(id),
  CONSTRAINT fk_patins_provider FOREIGN KEY (provider_id) REFERENCES insurance_providers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 33: insurance_claims ──────────────────────────────────
CREATE TABLE insurance_claims (
  id              INT           NOT NULL AUTO_INCREMENT,
  claim_no        VARCHAR(20)   NOT NULL,
  patient_ins_id  INT           NOT NULL,
  bill_id         INT           NOT NULL,
  claimed_amount  DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  paid_amount     DECIMAL(12,2),
  status          ENUM('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','PAID') NOT NULL DEFAULT 'SUBMITTED',
  submitted_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     DATETIME,
  paid_at         DATETIME,
  notes           TEXT,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_claim_no    (claim_no),
  INDEX idx_claim_status    (status),
  CONSTRAINT fk_claim_patins FOREIGN KEY (patient_ins_id) REFERENCES patient_insurances(id),
  CONSTRAINT fk_claim_bill   FOREIGN KEY (bill_id)        REFERENCES bills(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 34: inventory_categories ─────────────────────────────
CREATE TABLE inventory_categories (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invcat_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 35: inventory_items ───────────────────────────────────
CREATE TABLE inventory_items (
  id            INT           NOT NULL AUTO_INCREMENT,
  item_code     VARCHAR(20)   NOT NULL,
  name          VARCHAR(200)  NOT NULL,
  category_id   INT           NOT NULL,
  unit          VARCHAR(30)   NOT NULL,
  quantity      INT           NOT NULL DEFAULT 0,
  reorder_level INT           NOT NULL DEFAULT 5,
  unit_cost     DECIMAL(10,2) NOT NULL,
  location      VARCHAR(100),
  supplier_id   INT,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_item_code    (item_code),
  INDEX idx_item_category    (category_id),
  CONSTRAINT fk_item_cat FOREIGN KEY (category_id) REFERENCES inventory_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 36: inventory_movements ───────────────────────────────
CREATE TABLE inventory_movements (
  id              INT      NOT NULL AUTO_INCREMENT,
  item_id         INT      NOT NULL,
  type            ENUM('IN','OUT','ADJUSTMENT','EXPIRED','DAMAGED') NOT NULL,
  quantity        INT      NOT NULL,
  reference       VARCHAR(100),
  reason          TEXT,
  performed_by_id INT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_invmov_item (item_id),
  CONSTRAINT fk_invmov_item FOREIGN KEY (item_id) REFERENCES inventory_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 37: attendances ───────────────────────────────────────
CREATE TABLE attendances (
  id             INT      NOT NULL AUTO_INCREMENT,
  employee_id    INT      NOT NULL,
  date           DATE     NOT NULL,
  check_in       DATETIME,
  check_out      DATETIME,
  status         ENUM('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE','HOLIDAY') NOT NULL DEFAULT 'PRESENT',
  work_hours     DECIMAL(5,2),
  overtime       DECIMAL(5,2),
  notes          TEXT,
  recorded_by_id INT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_emp_date (employee_id, date),
  INDEX idx_att_date                (date),
  INDEX idx_att_employee            (employee_id),
  CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 38: leave_types ───────────────────────────────────────
CREATE TABLE leave_types (
  id           INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  days_allowed INT          NOT NULL DEFAULT 21,
  is_paid      TINYINT(1)   NOT NULL DEFAULT 1,
  description  TEXT,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_leavetype_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 39: leave_requests ────────────────────────────────────
CREATE TABLE leave_requests (
  id              INT      NOT NULL AUTO_INCREMENT,
  employee_id     INT      NOT NULL,
  leave_type_id   INT      NOT NULL,
  start_date      DATE     NOT NULL,
  end_date        DATE     NOT NULL,
  total_days      INT      NOT NULL,
  reason          TEXT,
  status          ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  approved_by_id  INT,
  approved_at     DATETIME,
  rejection_note  TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_leave_employee (employee_id),
  INDEX idx_leave_status   (status),
  CONSTRAINT fk_leave_emp  FOREIGN KEY (employee_id)   REFERENCES employees(id),
  CONSTRAINT fk_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 40: payrolls ──────────────────────────────────────────
CREATE TABLE payrolls (
  id               INT           NOT NULL AUTO_INCREMENT,
  payroll_no       VARCHAR(20)   NOT NULL,
  employee_id      INT           NOT NULL,
  month            INT           NOT NULL,
  year             INT           NOT NULL,
  basic_salary     DECIMAL(12,2) NOT NULL,
  allowances       DECIMAL(12,2) NOT NULL DEFAULT 0,
  overtime         DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_salary     DECIMAL(12,2) NOT NULL,
  income_tax       DECIMAL(12,2) NOT NULL DEFAULT 0,
  pension_employee DECIMAL(12,2) NOT NULL DEFAULT 0,
  pension_employer DECIMAL(12,2) NOT NULL DEFAULT 0,
  other_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_salary       DECIMAL(12,2) NOT NULL,
  status           ENUM('DRAFT','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',
  approved_by_id   INT,
  approved_at      DATETIME,
  paid_at          DATETIME,
  payment_ref      VARCHAR(100),
  notes            TEXT,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payroll_no           (payroll_no),
  UNIQUE KEY uq_payroll_emp_mon_yr   (employee_id, month, year),
  INDEX idx_payroll_mon_yr           (month, year),
  CONSTRAINT fk_payroll_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 41: notifications ─────────────────────────────────────
CREATE TABLE notifications (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM('INFO','WARNING','ALERT','SUCCESS') NOT NULL DEFAULT 'INFO',
  module     VARCHAR(50),
  link       VARCHAR(300),
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  read_at    DATETIME,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_created   (created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TABLE 42: audit_logs ────────────────────────────────────────
CREATE TABLE audit_logs (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT,
  action      ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','PRINT') NOT NULL,
  module      VARCHAR(50)  NOT NULL,
  target_id   VARCHAR(50),
  target_type VARCHAR(50),
  old_data    JSON,
  new_data    JSON,
  ip_address  VARCHAR(50),
  user_agent  VARCHAR(300),
  description TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_user    (user_id),
  INDEX idx_audit_module  (module),
  INDEX idx_audit_action  (action),
  INDEX idx_audit_created (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════
-- RE-ENABLE FOREIGN KEYS
-- ═══════════════════════════════════════════════════════════════════
SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA — Default roles and admin user
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO roles (name, display_name, is_system) VALUES
  ('super_admin',  'Super Administrator', 1),
  ('admin',        'Administrator',       1),
  ('doctor',       'Doctor',              1),
  ('nurse',        'Nurse',               1),
  ('pharmacist',   'Pharmacist',          1),
  ('lab_tech',     'Lab Technician',      1),
  ('receptionist', 'Receptionist',        1),
  ('cashier',      'Cashier',             1);

-- Default department
INSERT INTO departments (name, code, is_active) VALUES ('Administration', 'ADMIN', 1);

-- Default admin user (password: Admin@1234)
-- bcrypt hash of Admin@1234
INSERT INTO users (username, email, password, role_id, is_active) VALUES
  ('admin', 'admin@yfmhospital.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1);

-- Default admin employee record
INSERT INTO employees (
  employee_no, user_id, first_name, last_name, gender,
  date_of_birth, phone, department_id, job_title,
  employment_type, status, hire_date, basic_salary
) VALUES (
  'EMP-0001', 1, 'System', 'Administrator', 'MALE',
  '1990-01-01', '0911000000', 1, 'System Administrator',
  'FULL_TIME', 'ACTIVE', '2024-01-01', 0
);

-- ═══════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════════
