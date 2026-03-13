export interface Supplier {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  gstNumber?: string
  paymentTerms?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PoStatus = 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  productName: string
  sku: string
  orderedQty: number
  receivedQty: number
  unitCost: number   // paise
  gstRate: number
  gstAmount: number  // paise
  totalCost: number  // paise
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplier?: Pick<Supplier, 'id' | 'name' | 'phone'>
  createdBy?: string
  status: PoStatus
  expectedDate?: string
  subtotal: number   // paise
  totalGst: number   // paise
  total: number      // paise
  notes?: string
  items?: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface GrnLine {
  purchaseOrderItemId: string
  productId: string
  productName: string
  sku: string
  orderedQty: number
  receivedQty: number
  unitCost: number   // paise
  gstRate: number
  gstAmount: number  // paise
}

export interface GoodsReceivedNote {
  id: string
  grnNumber: string
  purchaseOrderId: string
  receivedBy?: string
  lineItems: GrnLine[]
  invoiceNumber?: string
  invoiceDate?: string
  totalReceived: number  // paise
  notes?: string
  createdAt: string
}
