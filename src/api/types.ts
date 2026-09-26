export type User = {
  id: number;
  full_name: string;
  username: string;
  role: string;
};

export type Table = {
  id: number;
  code: string;
  capacity: number;
  zone: string;
  status: "FREE" | "OCCUPIED" | "RESERVED" | "CLEANING";
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
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
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