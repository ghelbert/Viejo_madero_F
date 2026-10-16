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
  orders: (status?: string, orderType?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (orderType) params.set("orderType", orderType);
    const query = params.toString();
    return request<Order[]>(`/orders${query ? `?${query}` : ""}`);
  },
  deliveryOrders: () => request<Order[]>("/delivery-orders"),
  deliveryDispatch: () => request<Order[]>("/delivery-orders/dispatch"),
  deliveryHistory: () => request<Order[]>("/delivery-orders/history"),
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
  createDeliveryOrder: (data: {
    orderType: "DELIVERY" | "TAKEAWAY";
    createdBy: number;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    paymentMethod: "YAPE" | "PLIN" | "CASH";
    notes: string;
    items: OrderItemInput[];
  }) =>
    request<Order>("/delivery-orders", {
      method: "POST",
      body: JSON.stringify(data),
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
  startDeliveryRoute: (id: number, userId: number) =>
    request<Order>(`/orders/${id}/route?userId=${userId}`, { method: "POST" }),
  completeDelivery: (id: number, userId: number, note: string) =>
    request<Order>(`/orders/${id}/delivery`, {
      method: "POST",
      body: JSON.stringify({ userId, note }),
    }),
};