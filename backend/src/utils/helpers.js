/**
 * General Helper Utilities
 */

const crypto = require('crypto');

/**
 * Generate a unique patient/record ID with prefix
 * @param {string} prefix - e.g. 'PAT', 'LAB', 'RX', 'INV'
 * @returns {string}
 */
const generateId = (prefix = 'ID') => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${random}`;
};

/**
 * Generate a secure random token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Build pagination params from query
 */
const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build search filter for Prisma
 * @param {string[]} fields - Fields to search
 * @param {string} searchTerm
 * @returns {Object} Prisma OR filter
 */
const buildSearchFilter = (fields, searchTerm) => {
  if (!searchTerm) return {};
  return {
    OR: fields.map((field) => {
      const parts = field.split('.');
      if (parts.length === 1) {
        return { [field]: { contains: searchTerm } };
      }
      // Nested field (e.g. 'patient.firstName')
      let obj = { contains: searchTerm };
      for (let i = parts.length - 1; i >= 0; i--) {
        obj = { [parts[i]]: obj };
      }
      return obj;
    }),
  };
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Format datetime to readable string
 */
const formatDateTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Sanitize an object by removing undefined/null fields
 */
const sanitizeObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
};

/**
 * Slugify a string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = {
  generateId,
  generateToken,
  getPaginationParams,
  buildSearchFilter,
  formatDate,
  formatDateTime,
  calculateAge,
  sanitizeObject,
  slugify,
};
