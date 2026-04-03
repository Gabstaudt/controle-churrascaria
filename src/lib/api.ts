import type { Product, StockItem } from '@/lib/store';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listProducts: () => request<Product[]>('/products'),
  listApprovedProducts: () => request<Product[]>('/products/approved'),
  createProduct: (payload: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteProduct: (id: string) =>
    request<{ success: true }>(`/products/${id}`, { method: 'DELETE' }),
  updateProductStatus: (id: string, status: Product['status']) =>
    request<Product>(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  listStock: () => request<StockItem[]>('/stock'),
  listStockHistory: () =>
    request<Array<{ id: string; type: 'entry' | 'exit'; productCode: string; productName: string; quantity: number; actorName: string; actorCode?: string; source: 'employee' | 'admin' | 'system'; timestamp: string }>>('/stock/history'),
  addStock: (query: string, quantity: number, actor?: { actorName?: string; actorCode?: string; source?: 'employee' | 'admin' | 'system' }) =>
    request<StockItem>('/stock/entry', { method: 'POST', body: JSON.stringify({ query, quantity, ...actor }) }),
  removeStock: (query: string, quantity: number, actor?: { actorName?: string; actorCode?: string; source?: 'employee' | 'admin' | 'system' }) =>
    request<{ success: true; exits: Array<{ id: string; barcode: string; productCode: string; productName: string; productPrice: number; createdAt: string }> }>('/stock/exit', { method: 'POST', body: JSON.stringify({ query, quantity, ...actor }) }),
  updateStockQuantity: (productCode: string, quantity: number) =>
    request<{ success: true }>(`/stock/${encodeURIComponent(productCode)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  listPendingStockExits: () =>
    request<Array<{ id: string; barcode: string; productCode: string; productName: string; productPrice: number; status: 'pending' | 'paid'; createdAt: string }>>('/stock/exits/pending'),
  findStockExitByBarcode: (barcode: string) =>
    request<{ id: string; barcode: string; productCode: string; productName: string; productPrice: number; status: 'pending' | 'paid'; createdAt: string }>(
      `/stock/exits/barcode/${encodeURIComponent(barcode)}`,
    ),
  finalizeStockCheckout: (barcodes: string[], paidBy?: string) =>
    request<{ success: true; paidCount: number; total: number; paidAt: string; items: Array<{ id: string; barcode: string; productName: string; productPrice: number }> }>(
      '/stock/checkout/finalize',
      {
        method: 'POST',
        body: JSON.stringify({ barcodes, paidBy }),
      },
    ),

  listRhDocuments: (userId: string) =>
    request<Array<{ id: string; title: string; category: string; description: string; referenceUrl?: string; fileName?: string; fileType?: string; fileSize?: number; createdAt: string }>>(
      `/users/${encodeURIComponent(userId)}/rh/documents`,
    ),
  createRhDocumentByLink: (userId: string, payload: { title: string; category?: string; description?: string; referenceUrl: string }) =>
    request(`/users/${encodeURIComponent(userId)}/rh/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadRhDocument: (userId: string, payload: { title: string; category?: string; description?: string; file: File }) => {
    const form = new FormData();
    form.append('title', payload.title);
    if (payload.category) form.append('category', payload.category);
    if (payload.description) form.append('description', payload.description);
    form.append('file', payload.file);
    return request(`/users/${encodeURIComponent(userId)}/rh/documents/upload`, {
      method: 'POST',
      body: form,
    });
  },
  removeRhDocument: (userId: string, documentId: string) =>
    request<{ success: true }>(`/users/${encodeURIComponent(userId)}/rh/documents/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    }),
  listRhNotes: (userId: string) =>
    request<Array<{ id: string; content: string; createdAt: string; createdBy?: string }>>(
      `/users/${encodeURIComponent(userId)}/rh/notes`,
    ),
  createRhNote: (userId: string, payload: { content: string; createdBy?: string }) =>
    request(`/users/${encodeURIComponent(userId)}/rh/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeRhNote: (userId: string, noteId: string) =>
    request<{ success: true }>(`/users/${encodeURIComponent(userId)}/rh/notes/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    }),
  listRhPayroll: (userId: string) =>
    request<Array<{ id: string; monthKey: string; baseSalary: number; voucherQuantity: number; voucherAmount: number; paidCash: number; paidBank: number; bonuses: number; discounts: number; notes: string; updatedAt: string }>>(
      `/users/${encodeURIComponent(userId)}/rh/payroll`,
    ),
  saveRhPayroll: (userId: string, payload: { monthKey: string; baseSalary: number; voucherQuantity: number; voucherAmount: number; paidCash: number; paidBank: number; bonuses: number; discounts: number; notes?: string }) =>
    request(`/users/${encodeURIComponent(userId)}/rh/payroll`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeRhPayroll: (userId: string, monthKey: string) =>
    request<{ success: true }>(`/users/${encodeURIComponent(userId)}/rh/payroll/${encodeURIComponent(monthKey)}`, {
      method: 'DELETE',
    }),
};
