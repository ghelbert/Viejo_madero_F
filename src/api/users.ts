import { request } from "./http";
import type { User } from "./types";

export const usersApi = {
  users: () => request<Array<User & { active: boolean }>>("/users"),
  createUser: (data: {
    fullName: string;
    username: string;
    password: string;
    role: string;
  }) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (
    id: number,
    data: {
      fullName: string;
      username: string;
      password: string;
      role: string;
    },
  ) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggleUser: (id: number, active: boolean) =>
    request(`/users/${id}/active?active=${active}`, { method: "PATCH" }),
};