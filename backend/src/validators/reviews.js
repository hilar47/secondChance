const { z } = require('zod');

const createReview = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

module.exports = { createReview };
