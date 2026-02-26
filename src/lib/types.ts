export type Grade = "administrateur" | "technicien";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  grade: Grade;
  fromProvince: string;
}

export type TransferType = "mutual" | "cycle";
export type TransferStatus = "pending" | "approved" | "rejected";

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
