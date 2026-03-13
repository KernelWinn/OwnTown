import { api } from './api'
import type { Product, Category, ProductVariant } from '@owntown/types'

// ─── Products ────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get<Product[]>('/admin/products', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Product>(`/admin/products/${id}`).then(r => r.data),

  create: (data: Partial<Product>) =>
    api.post<Product>('/admin/products', data).then(r => r.data),

  update: (id: string, data: Partial<Product>) =>
    api.put<Product>(`/admin/products/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/admin/products/${id}`).then(r => r.data),

  updateStock: (id: string, stockQuantity: number) =>
    api.patch(`/admin/products/${id}/stock`, { stockQuantity }).then(r => r.data),

  getUploadUrl: (mime: string) =>
    api.get<{ url: string; key: string }>('/admin/products/upload-url', { params: { mime } }).then(r => r.data),

  addImages: (id: string, keys: string[]) =>
    api.post<Product>(`/admin/products/${id}/images`, { keys }).then(r => r.data),

  removeImage: (id: string, imageUrl: string) =>
    api.delete(`/admin/products/${id}/images`, { data: { imageUrl } }).then(r => r.data),

  lowStock: () =>
    api.get<Product[]>('/admin/products/low-stock').then(r => r.data),

  // Variants
  listVariants: (productId: string) =>
    api.get<ProductVariant[]>(`/admin/products/${productId}/variants`).then(r => r.data),

  createVariant: (productId: string, data: Omit<ProductVariant, 'id' | 'productId' | 'createdAt' | 'updatedAt'>) =>
    api.post<ProductVariant>(`/admin/products/${productId}/variants`, data).then(r => r.data),

  updateVariant: (productId: string, variantId: string, data: Partial<ProductVariant>) =>
    api.patch<ProductVariant>(`/admin/products/${productId}/variants/${variantId}`, data).then(r => r.data),

  deleteVariant: (productId: string, variantId: string) =>
    api.delete(`/admin/products/${productId}/variants/${variantId}`).then(r => r.data),
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () =>
    api.get<Category[]>('/admin/products/categories/all').then(r => r.data),

  create: (data: Partial<Category>) =>
    api.post<Category>('/admin/products/categories', data).then(r => r.data),

  update: (id: string, data: Partial<Category>) =>
    api.put<Category>(`/admin/products/categories/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/admin/products/categories/${id}`).then(r => r.data),

  getUploadUrl: (mime: string) =>
    api.get<{ url: string; key: string }>('/admin/products/categories/upload-url', { params: { mime } }).then(r => r.data),
}

// ─── Procurement ──────────────────────────────────────────────────────────────

import type { Supplier, PurchaseOrder, GoodsReceivedNote } from '@owntown/types'

export const procurementApi = {
  // Suppliers
  listSuppliers: () =>
    api.get<Supplier[]>('/admin/procurement/suppliers').then(r => r.data),
  createSupplier: (data: Partial<Supplier>) =>
    api.post<Supplier>('/admin/procurement/suppliers', data).then(r => r.data),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    api.put<Supplier>(`/admin/procurement/suppliers/${id}`, data).then(r => r.data),
  removeSupplier: (id: string) =>
    api.delete(`/admin/procurement/suppliers/${id}`).then(r => r.data),

  // Purchase Orders
  listPos: () =>
    api.get<PurchaseOrder[]>('/admin/procurement/purchase-orders').then(r => r.data),
  getPo: (id: string) =>
    api.get<PurchaseOrder>(`/admin/procurement/purchase-orders/${id}`).then(r => r.data),
  createPo: (data: { supplierId: string; expectedDate?: string; notes?: string; items: { productId: string; orderedQty: number; unitCost: number }[] }) =>
    api.post<PurchaseOrder>('/admin/procurement/purchase-orders', data).then(r => r.data),
  updatePoStatus: (id: string, status: string) =>
    api.put<PurchaseOrder>(`/admin/procurement/purchase-orders/${id}/status`, { status }).then(r => r.data),
  deletePo: (id: string) =>
    api.delete(`/admin/procurement/purchase-orders/${id}`).then(r => r.data),

  // GRNs
  listGrns: (purchaseOrderId?: string) =>
    api.get<GoodsReceivedNote[]>('/admin/procurement/grns', { params: { purchaseOrderId } }).then(r => r.data),
  getGrn: (id: string) =>
    api.get<GoodsReceivedNote>(`/admin/procurement/grns/${id}`).then(r => r.data),
  createGrn: (data: { purchaseOrderId: string; invoiceNumber?: string; invoiceDate?: string; notes?: string; lines: { purchaseOrderItemId: string; receivedQty: number; unitCost: number }[] }) =>
    api.post<GoodsReceivedNote>('/admin/procurement/grns', data).then(r => r.data),
}

// ─── S3 direct upload helper ──────────────────────────────────────────────────

export async function uploadImageToS3(file: File, folder: 'products' | 'categories'): Promise<string> {
  const getUrl = folder === 'products' ? productsApi.getUploadUrl : categoriesApi.getUploadUrl
  const { url, key } = await getUrl(file.type)
  await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  return key
}
