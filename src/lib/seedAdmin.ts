import { getUsers, saveUser } from "./storage";
import { User } from "./types";

const ADMIN_EMAIL = "admin@mouvement.ma";

export const seedDefaultAdmin = () => {
  const users = getUsers();
  if (users.some((u) => u.email === ADMIN_EMAIL)) return;

  const admin: User = {
    id: "admin-default-001",
    firstName: "Admin",
    lastName: "Système",
    email: ADMIN_EMAIL,
    password: "admin123",
    grade: "administrateur",
    region: "Rabat-Salé-Kénitra",
    fromProvince: "Rabat",
    role: "admin",
  };
  saveUser(admin);
};
