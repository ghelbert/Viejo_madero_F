import { request } from "./http";
import type { Product, Category } from "./types";

export const productsApi = {
  products: () => request<Product[]>("/products"),
  adminProducts: () => request<Product[]>("/admin/products"),
  categories: () => request<Category[]>("/categories"),
  updateProduct: (product: Product, available: boolean) =>
    request(`/products/${product.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        category: product.category,
        name: product.name,
        description: product.description,
        price: Number(product.base_price),
        prepMinutes: 10,
        available,
      }),
    }),
  createProduct: (data: {
    category: string;
    name: string;
    description: string;
    price: number;
    prepMinutes: number;
  }) => request("/products", { method: "POST", body: JSON.stringify(data) }),
};