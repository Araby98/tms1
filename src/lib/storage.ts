import { User, TransferRequest } from "./types";

const USERS_KEY = "movement_users";
const CURRENT_USER_KEY = "movement_current_user";
const TRANSFERS_KEY = "movement_transfers";

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find((u) => u.email === email);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getTransfers = (): TransferRequest[] => {
  const data = localStorage.getItem(TRANSFERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransfer = (transfer: TransferRequest): void => {
  const transfers = getTransfers();
  transfers.push(transfer);
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
};

export const updateTransfer = (id: string, updates: Partial<TransferRequest>): void => {
  const transfers = getTransfers();
  const idx = transfers.findIndex((t) => t.id === id);
  if (idx !== -1) {
    transfers[idx] = { ...transfers[idx], ...updates };
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
  }
};
