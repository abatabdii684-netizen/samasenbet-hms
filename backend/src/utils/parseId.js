/**
 * Safely parse a route param as an integer.
 * Returns null if the value is missing or not a valid integer.
 */
const parseId = (param) => {
  const n = parseInt(param, 10);
  return isNaN(n) ? null : n;
};

module.exports = parseId;
