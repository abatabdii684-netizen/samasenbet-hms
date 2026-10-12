/**
 * Request Validation Middleware
 * Uses express-validator
 */

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(AppError.validationError('Validation failed', formattedErrors));
  }

  next();
};

module.exports = validate;
