import { authApi } from "./auth";
import { tablesApi } from "./tables";
import { productsApi } from "./products";
import { usersApi } from "./users";
import { ordersApi } from "./orders";

// Mantiene la misma superficie pública que antes (api.login, api.tables, etc.)
// para no romper el código que ya consume este módulo.
export const api = {
  ...authApi,
  ...tablesApi,
  ...productsApi,
  ...usersApi,
  ...ordersApi,
};

export * from "./types";