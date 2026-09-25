import { request } from "./http";
import type { Order, OrderDetail } from "./types";

type OrderItemInput = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  notes: string;
};

export const ordersApi = {
  orders: (status?: string) =>
    request<Order[]>(`/orders${status ? `?status=${status}` : ""}`),
  orderDetail: (id: number) => request<OrderDetail>(`/orders/${id}/detail`),
  createOrder: (
    tableId: number,
    createdBy: number,
    customerName: string,
    items: OrderItemInput[],
  ) =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify({ tableId, createdBy, customerName, items }),
    }),
  updateOrderItems: (
    id: number,
    customerName: string,
    items: OrderItemInput[],
  ) =>
    request<Order>(`/orders/${id}/items`, {
      method: "PATCH",
      body: JSON.stringify({ customerName, items }),
    }),
  deleteOrder: (id: number) =>
    request<void>(`/orders/${id}`, { method: "DELETE" }),
  confirmOrder: (id: number, userId: number) =>
    request<Order>(`/orders/${id}/confirm?userId=${userId}`, {
      method: "POST",
    }),
  updateOrder: (id: number, status: string, userId: number) =>
    request<Order>(`/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, userId }),
    }),
};