import { User, TransferRequest, TransferWish, Notification } from "./types";

// ── In-memory data store ──
let users: User[] = [];
let currentUser: User | null = null;
let transfers: TransferRequest[] = [];
let wishes: TransferWish[] = [];
let notifications: Notification[] = [];

// ── Users ──
export const getUsers = (): User[] => users;

export const saveUser = (user: User): void => {
  users.push(user);
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find((u) => u.email === email);
};

export const getCurrentUser = (): User | null => currentUser;

export const setCurrentUser = (user: User | null): void => {
  currentUser = user;
};

// ── Transfers ──
export const getTransfers = (): TransferRequest[] => transfers;

export const saveTransfer = (transfer: TransferRequest): void => {
  transfers.push(transfer);
};

export const updateTransfer = (id: string, updates: Partial<TransferRequest>): void => {
  const idx = transfers.findIndex((t) => t.id === id);
  if (idx !== -1) {
    transfers[idx] = { ...transfers[idx], ...updates };
  }
};

// ── Wishes ──
export const getWishes = (): TransferWish[] => wishes;

export const saveWish = (wish: TransferWish): void => {
  wishes.push(wish);
};

export const updateWish = (id: string, updates: Partial<TransferWish>): void => {
  const idx = wishes.findIndex((w) => w.id === id);
  if (idx !== -1) {
    wishes[idx] = { ...wishes[idx], ...updates };
  }
};

export const deleteWish = (id: string): void => {
  wishes = wishes.filter((w) => w.id !== id);
};

export const hasExistingWish = (userId: string, fromProvince: string, toProvince: string): boolean => {
  return wishes.some(
    (w) => w.userId === userId && w.fromProvince === fromProvince && w.toProvince === toProvince && !w.matchedTransferId
  );
};

// ── Users update ──
export const updateUser = (id: string, updates: Partial<User>): void => {
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
  }
};

// ── Notifications ──
export const getNotifications = (): Notification[] => notifications;

export const saveNotification = (notification: Notification): void => {
  notifications.push(notification);
};

export const getUnreadNotifications = (userId: string): Notification[] => {
  return notifications.filter((n) => n.userId === userId && !n.read);
};

export const markNotificationsRead = (userId: string): void => {
  notifications = notifications.map((n) =>
    n.userId === userId ? { ...n, read: true } : n
  );
};

// ── Auto-matching ──
export const tryAutoMatch = (newWish: TransferWish): TransferRequest | null => {
  const wishes = getWishes().filter((w) => !w.matchedTransferId && w.id !== newWish.id);

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

  for (const wishB of wishes) {
    if (wishB.fromProvince !== newWish.toProvince) continue;
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
