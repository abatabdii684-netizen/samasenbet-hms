/**
 * Formatting Utilities
 */

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (amount, currency = 'ETB') => {
  if (amount == null) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

export const formatAge = (dob) => {
  if (!dob) return '—';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
};

export const formatGender = (g) => {
  if (!g) return '—';
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
};

export const formatBloodGroup = (bg) => {
  if (!bg || bg === 'UNKNOWN') return 'Unknown';
  return bg.replace('_POS', '+').replace('_NEG', '-');
};

export const formatPhone = (phone) => phone || '—';

export const truncate = (str, max = 40) => {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
