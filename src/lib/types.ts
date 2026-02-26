export type Grade = "administrateur" | "technicien";
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  grade: Grade;
  region: string;
  fromProvince: string;
  role: UserRole;
}

export type TransferType = "mutual" | "cycle";
export type TransferStatus = "pending" | "approved" | "rejected";

// Individual wish: "I want to move from A to B"
export interface TransferWish {
  id: string;
  userId: string;
  fromProvince: string;
  toProvince: string;
  createdAt: string;
  matchedTransferId?: string; // linked when auto-matched
}

export interface TransferRequest {
  id: string;
  type: TransferType;
  status: TransferStatus;
  createdAt: string;
  participants: {
    userId: string;
    fromProvince: string;
    toProvince: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}
