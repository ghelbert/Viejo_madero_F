import { request } from "./http";
import type { User } from "./types";
 
export const authApi = {
  login: (username: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};
 