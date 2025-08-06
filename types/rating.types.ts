// Rating TypeScript Types and Interfaces

export interface Rating {
  id: string;
  renterId: string;
  storageId: string;
  star: number; // 1-5
  comment: string;
  ratingDate: string; // ISO date string
  
  // Additional display properties from ViewRatingModel
  renterName?: string;
  storageAddress?: string;
}

export interface CreateRatingApiRequest {
  renterId: string;
  storageId: string;
  star: number; // 1-5, required
  comment: string; // required (max 500 chars)
}

export interface UpdateRatingApiRequest {
  id: string;
  star: number; // 1-5, required
  comment: string; // required (max 500 chars)
}

export interface RatingQuery {
  pageSize?: number; // default: 5
  pageIndex?: number; // default: 1
}

// API Response types
export interface RatingResponse {
  statusCode: number;
  code: string;
  message: string;
  data?: Rating | Rating[] | string; // Can be single rating, array, or ID
}

export interface PaginatedRatingResponse {
  statusCode: number;
  code: string;
  message: string;
  data: {
    items: Rating[];
    pageIndex: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// Form validation types
export interface RatingFormData {
  star: number;
  comment: string;
}

export interface RatingFormErrors {
  star?: string;
  comment?: string;
  general?: string;
}

// Rating status for orders
export interface OrderRatingStatus {
  hasRating: boolean;
  rating?: Rating;
  canRate: boolean; // true if order is COMPLETED and no rating exists
  canEdit: boolean; // true if rating exists and user can edit
}

// Rating statistics (for storage display)
export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    [key: number]: number; // star rating -> count
  };
}

// Component props types
export interface RatingFormProps {
  orderId: string;
  storageId: string;
  storageAddress: string;
  existingRating?: Rating;
  onSuccess: (rating: Rating) => void;
  onCancel: () => void;
}

export interface OrderRatingCardProps {
  orderId: string;
  storageId: string;
  storageAddress: string;
  orderStatus: string;
  renterId: string; // This is actually userId but keeping prop name for compatibility
  existingRating?: Rating;
  onRatingComplete: (rating: Rating) => void;
  className?: string;
}

export interface RatingHistoryProps {
  renterId: string;
}

export interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}

// Navigation types
export interface RatingFormNavigationParams {
  orderId: string;
  storageId: string;
  storageAddress: string;
  existingRating?: string; // JSON stringified Rating object
}

export interface RatingHistoryNavigationParams {
  renterId: string;
}

// Error types
export interface RatingApiError {
  statusCode: number;
  code: string;
  message: string;
  errors?: string[];
}

// Validation constants
export const RATING_VALIDATION = {
  MIN_STAR: 1,
  MAX_STAR: 5,
  MAX_COMMENT_LENGTH: 500,
  MIN_COMMENT_LENGTH: 10, // Custom requirement for meaningful comments
} as const;

// API endpoints
export const RATING_ENDPOINTS = {
  GET_ALL: '/api/Rating/all',
  GET_BY_ID: (id: string) => `/api/Rating/${id}`,
  CREATE: '/api/Rating',
  UPDATE: '/api/Rating',
  DELETE: (id: string) => `/api/Rating/${id}`,
  GET_BY_RENTER: (renterId: string) => `/api/Rating/renter/${renterId}`,
  GET_BY_STORAGE: (storageId: string) => `/api/Rating/storage/${storageId}`,
} as const;

// Query keys for React Query
export const RATING_QUERY_KEYS = {
  ALL: ['ratings'] as const,
  BY_ID: (id: string) => ['ratings', id] as const,
  BY_RENTER: (renterId: string) => ['ratings', 'renter', renterId] as const,
  BY_STORAGE: (storageId: string) => ['ratings', 'storage', storageId] as const,
  STATS: (storageId: string) => ['ratings', 'stats', storageId] as const,
} as const;

// Helper type for React Query keys
export type RatingQueryKey = 
  | typeof RATING_QUERY_KEYS.ALL
  | ReturnType<typeof RATING_QUERY_KEYS.BY_ID>
  | ReturnType<typeof RATING_QUERY_KEYS.BY_RENTER>
  | ReturnType<typeof RATING_QUERY_KEYS.BY_STORAGE>
  | ReturnType<typeof RATING_QUERY_KEYS.STATS>;