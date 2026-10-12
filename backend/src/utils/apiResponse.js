/**
 * Standardized API Response Utility
 */

class ApiResponse {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @param {Object} meta - Pagination/extra metadata
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  /**
   * Created response
   */
  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Error response
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  /**
   * Bad request (400)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  /**
   * Forbidden (403)
   */
  static forbidden(res, message = 'Access denied') {
    return ApiResponse.error(res, message, 403);
  }

  /**
   * Not found (404)
   */
  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  /**
   * Conflict (409)
   */
  static conflict(res, message = 'Resource already exists') {
    return ApiResponse.error(res, message, 409);
  }

  /**
   * Paginated response
   */
  static paginated(res, data, page, limit, total, message = 'Success') {
    const totalPages = Math.ceil(total / limit);
    return ApiResponse.success(res, data, message, 200, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  }
}

module.exports = ApiResponse;
