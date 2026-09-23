const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'No se pudo completar la operación')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export type User = { id: number; fullName: string; username: string; role: string }
export type Table = { id: number; code: string; capacity: number; zone: string; status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' }
export type Product = { id: number; name: string; description: string; base_price: number; category: string; available?: boolean }
export type Order = { id: number; code: string; status: string; total: number; table_code?: string; waiter?: string }

export const api = {
  login: (username: string, password: string) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  tables: () => request<Table[]>('/tables'),
  products: () => request<Product[]>('/products'),
  users: () => request<Array<User & { active: boolean }>>('/users'),
  orders: (status?: string) => request<Order[]>(`/orders${status ? `?status=${status}` : ''}`),
  createOrder: (tableId: number, createdBy: number, items: Array<{ productId: number; productName: string; price: number; quantity: number; notes: string }>) => request<Order>('/orders', { method: 'POST', body: JSON.stringify({ tableId, createdBy, items }) }),
  confirmOrder: (id: number, userId: number) => request<Order>(`/orders/${id}/confirm?userId=${userId}`, { method: 'POST' }),
  updateOrder: (id: number, status: string, userId: number) => request<Order>(`/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status, userId }) }),
  createUser: (data: { fullName: string; username: string; password: string; role: string }) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  toggleUser: (id: number, active: boolean) => request(`/users/${id}/active?active=${active}`, { method: 'PATCH' }),
  updateProduct: (product: Product, available: boolean) => request(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ category: product.category, name: product.name, description: product.description, price: Number(product.base_price), prepMinutes: 10, available }) }),
}
