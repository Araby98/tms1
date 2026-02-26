import { User, TransferRequest, TransferWish } from "./types";

const USERS_KEY = "movement_users";
const CURRENT_USER_KEY = "movement_current_user";
const TRANSFERS_KEY = "movement_transfers";
const WISHES_KEY = "movement_wishes";

// ── Users ──
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

// ── Transfers ──
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

// ── Wishes ──
export const getWishes = (): TransferWish[] => {
  const data = localStorage.getItem(WISHES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveWish = (wish: TransferWish): void => {
  const wishes = getWishes();
  wishes.push(wish);
  localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
};

export const updateWish = (id: string, updates: Partial<TransferWish>): void => {
  const wishes = getWishes();
  const idx = wishes.findIndex((w) => w.id === id);
  if (idx !== -1) {
    wishes[idx] = { ...wishes[idx], ...updates };
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
  }
};

export const hasExistingWish = (userId: string, fromProvince: string, toProvince: string): boolean => {
  return getWishes().some(
    (w) => w.userId === userId && w.fromProvince === fromProvince && w.toProvince === toProvince && !w.matchedTransferId
  );
};

// ── Auto-matching ──
export const tryAutoMatch = (newWish: TransferWish): TransferRequest | null => {
  const wishes = getWishes().filter((w) => !w.matchedTransferId && w.id !== newWish.id);

  // Try mutual match: someone wants the exact reverse
  const mutualMatch = wishes.find(
    (w) => w.fromProvince === newWish.toProvince && w.toProvince === newWish.fromProvince
  );

  if (mutualMatch) {
    const transfer: TransferRequest = {
      id: crypto.randomUUID(),
      type: "mutual",
      status: "pending",
      createdAt: new Date().toISOString(),
      participants: [
        { userId: newWish.userId, fromProvince: newWish.fromProvince, toProvince: newWish.toProvince },
        { userId: mutualMatch.userId, fromProvince: mutualMatch.fromProvince, toProvince: mutualMatch.toProvince },
      ],
    };
    saveTransfer(transfer);
    updateWish(newWish.id, { matchedTransferId: transfer.id });
    updateWish(mutualMatch.id, { matchedTransferId: transfer.id });
    return transfer;
  }

  // Try cycle match: A→B, B→C, C→A
  for (const wishB of wishes) {
    if (wishB.fromProvince !== newWish.toProvince) continue; // B starts where A wants to go
    const wishC = wishes.find(
      (w) =>
        w.id !== wishB.id &&
        w.fromProvince === wishB.toProvince &&
        w.toProvince === newWish.fromProvince
    );
    if (wishC) {
      const transfer: TransferRequest = {
        id: crypto.randomUUID(),
        type: "cycle",
        status: "pending",
        createdAt: new Date().toISOString(),
        participants: [
          { userId: newWish.userId, fromProvince: newWish.fromProvince, toProvince: newWish.toProvince },
          { userId: wishB.userId, fromProvince: wishB.fromProvince, toProvince: wishB.toProvince },
          { userId: wishC.userId, fromProvince: wishC.fromProvince, toProvince: wishC.toProvince },
        ],
      };
      saveTransfer(transfer);
      updateWish(newWish.id, { matchedTransferId: transfer.id });
      updateWish(wishB.id, { matchedTransferId: transfer.id });
      updateWish(wishC.id, { matchedTransferId: transfer.id });
      return transfer;
    }
  }

  return null;
};
