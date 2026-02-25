// User types
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  location?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  accessToken?: string;
  role?: string;
}

export type UserPublic = Omit<User, 'password_hash'>;

// Item types
export type ItemCategory =
  | 'Electronics'
  | 'ID Cards'
  | 'ATM Card'
  | 'Books'
  | 'Clothing'
  | 'Accessories'
  | 'Keys'
  | 'Documents'
  | 'Other';

export type ItemStatus = 'Lost' | 'Found' | 'Claimed';

export interface Item {
  id: string;
  finder_id: string;
  title: string;
  category: ItemCategory;
  location: string;
  description: string;
  photo_url?: string;
  status: ItemStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ItemWithFinder extends Item {
  finder_name: string;
  finder_avatar?: string;
}

// Claim types
export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  status: ClaimStatus;
  proof_description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClaimWithDetails extends Claim {
  item_title: string;
  item_photo?: string;
  claimant_name: string;
}

// Message types
export interface Message {
  id: string;
  claim_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

export interface MessageWithSender extends Message {
  sender_name: string;
  sender_avatar?: string;
}

// Form types for Server Actions
export interface SignUpFormData {
  name: string;
  email: string;
  location: string;
  password: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ReportItemFormData {
  title: string;
  category: ItemCategory;
  location: string;
  description: string;
  photo?: File;
}

export interface ClaimItemFormData {
  item_id: string;
  proof_description: string;
}

// API Response types
export interface ActionResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Filter types for dashboard
export interface ItemFilters {
  search?: string;
  category?: ItemCategory;
  location?: string;
  status?: ItemStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
