/**
 * Middleware that validates :id route param is a valid integer.
 * Returns 400 if NaN — prevents Prisma from receiving invalid types.
 */
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID parameter' });
  }
  req.params.id = id; // replace string with integer
  next();
};

module.exports = validateId;
