const { z } = require('zod');
const { CATEGORIES, CONDITIONS, STATUSES } = require('../constants');
const { objectId, pagination } = require('./common');

const coordinates = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createItem = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(2000),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  images: z.array(z.string().url()).max(5).default([]),
  city: z.string().trim().max(80).optional(),
  coordinates: coordinates.optional(),
});

const updateItem = createItem
  .partial()
  .extend({ version: z.number().int().min(0).optional() })
  .refine(
    (v) => Object.keys(v).filter((k) => k !== 'version').length > 0,
    'Provide at least one field to update'
  );

const listItems = pagination
  .extend({
    q: z.string().trim().min(1).max(100).optional(),
    category: z.enum(CATEGORIES).optional(),
    condition: z.enum(CONDITIONS).optional(),
    city: z.string().trim().min(1).max(80).optional(),
    status: z.enum(STATUSES).default('available'),
    owner: objectId.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(0.1).max(500).default(10),
    sort: z.enum(['newest', 'oldest', 'relevance']).optional(),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), 'lat and lng must be provided together');

const myItems = pagination.extend({ type: z.enum(['listed', 'claimed']).default('listed') });

module.exports = { createItem, updateItem, listItems, myItems };
