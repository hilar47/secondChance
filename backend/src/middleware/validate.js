const AppError = require('../utils/AppError');

// validate({ body, query, params }) - each value is a zod schema.
// Parsed (coerced, trimmed, defaulted) values replace the raw input, and unknown keys
// are stripped, which also blocks NoSQL operator injection such as {"email": {"$gt": ""}}.
module.exports = (schemas) => (req, res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new AppError(400, 'Validation failed', details));
    }
    req[part] = result.data;
  }
  return next();
};
