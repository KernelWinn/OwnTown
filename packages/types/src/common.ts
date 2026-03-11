export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export type SortOrder = 'asc' | 'desc'

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
}
