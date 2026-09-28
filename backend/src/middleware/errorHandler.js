const AppError = require('../utils/AppError');

const notFound = (req, res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Internal server error';
  let details;

  if (err instanceof AppError) {
    ({ status, message, details } = err);
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === 'VersionError') {
    status = 409;
    message = 'This resource was modified by someone else. Reload it and try again.';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field === 'email' ? 'Email is already registered' : 'A conflicting record already exists';
  }

  if (status === 500) console.error(err); // eslint-disable-line no-console
  res.status(status).json({ error: { message, ...(details && { details }) } });
};

module.exports = { notFound, errorHandler };
