import type { Product, StockItem } from '@/lib/store';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
  addStock: (query: string, quantity: number) =>
    request<StockItem>('/stock/entry', { method: 'POST', body: JSON.stringify({ query, quantity }) }),
  removeStock: (query: string, quantity: number) =>
    request<{ success: true }>('/stock/exit', { method: 'POST', body: JSON.stringify({ query, quantity }) }),
  updateStockQuantity: (productCode: string, quantity: number) =>
    request<{ success: true }>(`/stock/${encodeURIComponent(productCode)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
};
