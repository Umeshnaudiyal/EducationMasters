import ApiError from '../utils/apiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const fieldErrors = {};
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        fieldErrors[key] = err.errors[key].message;
      });
    }
    const message = Object.values(fieldErrors)[0] || 'Validation failed. Please check the submitted data.';
    error = new ApiError(400, message, fieldErrors, err.stack);
  }

  // 2. Handle Mongoose Duplicate Key Error (Code 11000)
  else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const fieldErrors = {};
    let message = 'Duplicate key error.';
    if (err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      const val = err.keyValue[field];
      fieldErrors[field] = `A record with this ${field} ("${val}") already exists. Please use a unique value.`;
      message = `The ${field} "${val}" is already in use.`;
    }
    error = new ApiError(409, message, fieldErrors, err.stack);
  }

  // 3. Handle Mongoose CastError (Invalid ObjectId)
  else if (err.name === 'CastError') {
    const fieldErrors = { [err.path]: `Invalid identifier format: "${err.value}"` };
    const message = `Resource not found or invalid format for ${err.path}`;
    error = new ApiError(400, message, fieldErrors, err.stack);
  }

  // 4. Handle JSON Syntax Error (Malformed Request Body)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(400, 'Malformed JSON payload in request body.', {}, err.stack);
  }

  // 5. Handle JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.', {}, err.stack);
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.', {}, err.stack);
  }

  // 6. Handle Multer File Upload Errors
  else if (err.name === 'MulterError') {
    let message = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image file size exceeds the maximum allowed limit of 300 KB. Please compress or resize the image.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field encountered during upload.';
    }
    error = new ApiError(400, message, { file: message }, err.stack);
  }

  // 6. Wrap any unexpected errors into ApiError
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || {}, err.stack);
  }

  // Build uniform API response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    statusCode,
    message: error.message || 'An error occurred during request processing.',
    errors: error.errors && Object.keys(error.errors).length > 0 ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Log server errors for diagnostics in development
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
