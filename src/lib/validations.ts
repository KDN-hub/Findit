import { z } from 'zod';

// Email validation (personal emails allowed)
const emailSchema = z
  .string()
  .email('Please enter a valid email address');

// Babcock University email validation (for features that require it)
const babcockEmailSchema = z
  .string()
  .email('Please enter a valid email address')
  .refine(
    (email) => email.endsWith('@babcock.edu.ng'),
    'Only Babcock University emails (@babcock.edu.ng) are allowed'
  );

// Location options
const locationOptions = ['On Campus', 'Off Campus'] as const;

// Sign Up validation schema
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: emailSchema,
  location: z.enum(locationOptions, {
    message: 'Please select a location',
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Sign In validation schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Item categories enum
const itemCategories = [
  'Electronics',
  'ID Cards',
  'Books',
  'Clothing',
  'Accessories',
  'Keys',
  'Documents',
  'Other',
] as const;

// Report Item validation schema
export const reportItemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  category: z.enum(itemCategories, {
    message: 'Please select a valid category',
  }),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(255, 'Location must be less than 255 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
});

// Claim Item validation schema
export const claimItemSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  proof_description: z
    .string()
    .min(20, 'Please provide more details to verify your claim (at least 20 characters)')
    .max(1000, 'Proof description must be less than 1000 characters'),
});

// Message validation schema
export const messageSchema = z.object({
  claim_id: z.string().uuid('Invalid claim ID'),
  receiver_id: z.string().uuid('Invalid receiver ID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters'),
});

// Search/Filter validation schema
export const filterSchema = z.object({
  search: z.string().max(100).optional(),
  category: z.enum(itemCategories).optional(),
  location: z.string().max(255).optional(),
  status: z.enum(['Lost', 'Found', 'Claimed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ReportItemInput = z.infer<typeof reportItemSchema>;
export type ClaimItemInput = z.infer<typeof claimItemSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
