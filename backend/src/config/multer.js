/**
 * Multer File Upload Configuration
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// Ensure upload directories exist
const dirs = [
  UPLOAD_DIR,
  `${UPLOAD_DIR}/profiles`,
  `${UPLOAD_DIR}/documents`,
  `${UPLOAD_DIR}/lab-results`,
  `${UPLOAD_DIR}/prescriptions`,
  `${UPLOAD_DIR}/insurance`,
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = `${UPLOAD_DIR}/documents`;
    if (file.fieldname === 'profilePhoto') folder = `${UPLOAD_DIR}/profiles`;
    else if (file.fieldname === 'labResult') folder = `${UPLOAD_DIR}/lab-results`;
    else if (file.fieldname === 'prescription') folder = `${UPLOAD_DIR}/prescriptions`;
    else if (file.fieldname === 'insuranceDoc') folder = `${UPLOAD_DIR}/insurance`;
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;
