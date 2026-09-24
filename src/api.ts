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

export type User = { id: number; full_name: string; username: string; role: string }
export type Table = { id: number; code: string; capacity: number; zone: string; status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'; customer_name?: string }
export type Product = { id: number; name: string; description: string; base_price: number; category: string; available?: boolean }
export type Category = { id: number; name: string }
export type Order = { id: number; code: string; status: string; total: number; table_code?: string; waiter?: string; customer_name?: string }
export type OrderItem = { product_id: number; product_name: string; unit_price: number; quantity: number; line_total: number }
export type OrderDetail = Order & { items: OrderItem[] }
export type TableDetail = { table: Table; order: Order & { items: Array<{ product_id: number; product_name: string; unit_price: number; quantity: number; line_total: number }> } }

export const api = {
  login: (username: string, password: string) => request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  tables: () => request<Table[]>('/tables'),
  tableDetail: (id: number) => request<TableDetail>(`/tables/${id}/detail`),
  products: () => request<Product[]>('/products'),
  adminProducts: () => request<Product[]>('/admin/products'),
  categories: () => request<Category[]>('/categories'),
  users: () => request<Array<User & { active: boolean }>>('/users'),
  orders: (status?: string) => request<Order[]>(`/orders${status ? `?status=${status}` : ''}`),
  orderDetail: (id: number) => request<OrderDetail>(`/orders/${id}/detail`),
  createOrder: (tableId: number, createdBy: number, customerName: string, items: Array<{ productId: number; productName: string; price: number; quantity: number; notes: string }>) => request<Order>('/orders', { method: 'POST', body: JSON.stringify({ tableId, createdBy, customerName, items }) }),
    updateOrderItems: (id: number, customerName: string, items: Array<{ productId: number; productName: string; price: number; quantity: number; notes: string }>) => request<Order>(`/orders/${id}/items`, { method: 'PATCH', body: JSON.stringify({ customerName, items }) }),
    deleteOrder: (id: number) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
  confirmOrder: (id: number, userId: number) => request<Order>(`/orders/${id}/confirm?userId=${userId}`, { method: 'POST' }),
  updateOrder: (id: number, status: string, userId: number) => request<Order>(`/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status, userId }) }),
  createUser: (data: { fullName: string; username: string; password: string; role: string }) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: { fullName: string; username: string; password: string; role: string }) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleUser: (id: number, active: boolean) => request(`/users/${id}/active?active=${active}`, { method: 'PATCH' }),
  updateProduct: (product: Product, available: boolean) => request(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ category: product.category, name: product.name, description: product.description, price: Number(product.base_price), prepMinutes: 10, available }) }),
  createProduct: (data: { category: string; name: string; description: string; price: number; prepMinutes: number }) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
}
