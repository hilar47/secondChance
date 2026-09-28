const { z } = require('zod');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt ignores bytes beyond 72
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const email = z.string().trim().toLowerCase().email('Invalid email address');

const register = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password,
  city: z.string().trim().max(80).optional(),
});

const login = z.object({ email, password: z.string().min(1).max(72) });

const updateProfile = z
  .object({
    name: z.string().trim().min(2).max(60),
    city: z.string().trim().max(80),
    bio: z.string().trim().max(500),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

module.exports = { register, login, updateProfile };
