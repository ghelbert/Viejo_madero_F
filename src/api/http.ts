const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
 
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "No se pudo completar la operación");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
 