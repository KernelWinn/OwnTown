export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  icon?: string           // Emoji icon e.g. "🥦"
  parentId?: string       // For subcategories
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  title: string                       // e.g. "500g / Mango"
  options: Record<string, string>     // e.g. { "Size": "500g", "Flavor": "Mango" }
  price: number                       // paise
  mrp: number                         // paise
  sku: string
  barcode?: string
  stockQuantity: number
  lowStockThreshold: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  category?: Category
  images: string[]        // S3 URLs
  price: number           // in paise (₹ * 100)
  mrp: number             // MRP in paise
  unit: string            // "500g", "1L", "1 piece"
  stockQuantity: number
  lowStockThreshold: number
  sku: string
  barcode?: string
  gstCategory: GstCategory
  gstRate: number         // 0, 5, 12, 18
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  optionNames: string[]   // e.g. ["Size", "Flavor"]
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export type GstCategory =
  | 'exempt'        // 0% — fresh vegetables, fruits, milk
  | 'five'          // 5% — packaged food, tea, coffee
  | 'twelve'        // 12% — ghee, butter, cheese
  | 'eighteen'      // 18% — packaged beverages, cosmetics

export interface ProductWithStock extends Product {
  isAvailable: boolean    // stockQuantity > 0 && isActive
  discount: number        // percentage discount from MRP
}

export interface CreateProductDto {
  name: string
  description?: string
  categoryId: string
  price: number
  mrp: number
  unit: string
  stockQuantity: number
  lowStockThreshold?: number
  sku: string
  barcode?: string
  gstCategory: GstCategory
  isFeatured?: boolean
  tags?: string[]
}

export interface UpdateStockDto {
  productId: string
  quantity: number        // absolute value, not delta
}
