/**
 * Global Error Handler Middleware
 */

const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Handle Prisma known errors
 */
const handlePrismaError = (err) => {
  switch (err.code) {
    case 'P2002':
      return new AppError(
        `Duplicate value for field: ${err.meta?.target?.join(', ')}`,
        409
      );
    case 'P2003':
      return new AppError(`Foreign key constraint failed on: ${err.meta?.field_name}`, 400);
    case 'P2025':
      return new AppError('Record not found', 404);
    case 'P2014':
      return new AppError('The change violates a required relation', 400);
    case 'P2016':
      return new AppError('Query interpretation error', 400);
    default:
      return new AppError(`Database error: ${err.message}`, 500);
  }
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);

/**
 * Handle validation errors
 */
const handleValidationError = (err) => {
  const errors = err.errors || [];
  return new AppError('Validation failed', 422, errors);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
    error: err,
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors || undefined,
    });
  } else {
    logger.error('UNHANDLED ERROR:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all errors
  if (err.statusCode >= 500) {
    logger.error(`${req.method} ${req.path} — ${err.message}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
    });
  } else {
    logger.warn(`${req.method} ${req.path} — ${err.statusCode}: ${err.message}`);
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message, stack: err.stack };

    // Prisma errors
    if (error.code && error.code.startsWith('P')) error = handlePrismaError(error);
    // JWT errors
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    // Express-validator errors
    if (error.name === 'ValidationError') error = handleValidationError(error);

    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

module.exports = { errorHandler, notFound };
