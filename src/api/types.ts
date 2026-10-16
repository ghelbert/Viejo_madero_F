export type User = {
  id: number;
  full_name: string;
  username: string;
  role: "ADMINISTRADOR" | "MOZO" | "COCINERO" | "RECEPCIONISTA" | "REPARTIDOR";
};

export type Table = {
  id: number;
  code: string;
  capacity: number;
  zone: string;
  status: "FREE" | "OCCUPIED" | "ATTENDED" | "RESERVED" | "CLEANING";
  customer_name?: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  base_price: number;
  category: string;
  available?: boolean;
};

export type Category = { id: number; name: string };

export type Order = {
  id: number;
  code: string;
  status: string;
  total: number;
  table_code?: string;
  waiter?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type?: "DINE_IN" | "DELIVERY" | "TAKEAWAY";
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  payment_method?: "YAPE" | "PLIN" | "CASH";
  delivery_notes?: string;
  delivery_completion_note?: string;
  item_count?: number;
  created_at?: string;
  ready_at?: string;
  route_started_at?: string;
  delivered_at?: string;
  delivery_user_id?: number;
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  notes?: string;
};

export type OrderDetail = Order & { items: OrderItem[] };

export type TableDetail = {
  table: Table;
  order: Order & {
    items: Array<{
      product_id: number;
      product_name: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }>;
  };
};