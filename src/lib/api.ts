import { User, TransferRequest, TransferWish, Notification } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const request = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── Auth ──
export const apiLogin = (email: string, password: string): Promise<{ user: User; unreadNotifications: Notification[] }> =>
  request("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const apiSignup = (userData: Omit<User, "id" | "role">): Promise<{ user: User }> =>
  request("/api/signup", { method: "POST", body: JSON.stringify(userData) });

// ── Users ──
export const apiGetUsers = (): Promise<User[]> => request("/api/users");

export const apiUpdateUser = (id: string, updates: Partial<User>): Promise<{ user: User }> =>
  request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(updates) });

// ── Wishes ──
export const apiGetWishes = (userId?: string): Promise<TransferWish[]> =>
  request(`/api/wishes${userId ? `?userId=${userId}` : ""}`);

export const apiCreateWish = (data: { userId: string; fromProvince: string; toProvince: string }): Promise<{ wish: TransferWish; match: TransferRequest | null }> =>
  request("/api/wishes", { method: "POST", body: JSON.stringify(data) });

export const apiUpdateWish = (id: string, updates: Partial<TransferWish>): Promise<{ wish: TransferWish }> =>
  request(`/api/wishes/${id}`, { method: "PUT", body: JSON.stringify(updates) });

export const apiDeleteWish = (id: string): Promise<{ success: boolean }> =>
  request(`/api/wishes/${id}`, { method: "DELETE" });

// ── Transfers ──
export const apiGetTransfers = (userId?: string): Promise<TransferRequest[]> =>
  request(`/api/transfers${userId ? `?userId=${userId}` : ""}`);

export const apiUpdateTransfer = (id: string, updates: Partial<TransferRequest>): Promise<{ transfer: TransferRequest }> =>
  request(`/api/transfers/${id}`, { method: "PUT", body: JSON.stringify(updates) });

// ── Notifications ──
export const apiGetNotifications = (userId: string): Promise<Notification[]> =>
  request(`/api/notifications?userId=${userId}`);

export const apiCreateNotification = (notification: Notification): Promise<{ notification: Notification }> =>
  request("/api/notifications", { method: "POST", body: JSON.stringify(notification) });

export const apiMarkNotificationsRead = (userId: string): Promise<{ success: boolean }> =>
  request("/api/notifications/mark-read", { method: "PUT", body: JSON.stringify({ userId }) });
