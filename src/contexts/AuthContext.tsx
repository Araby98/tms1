import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/lib/types";
import { getCurrentUser, setCurrentUser, findUserByEmail, saveUser, updateUser, getUnreadNotifications, markNotificationsRead } from "@/lib/storage";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (userData: Omit<User, "id" | "role">) => { success: boolean; error?: string };
  updateProfile: (data: Partial<User>) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = (email: string, password: string) => {
    const found = findUserByEmail(email);
    if (!found) return { success: false, error: "Utilisateur introuvable" };
    if (found.password !== password) return { success: false, error: "Mot de passe incorrect" };
    setUser(found);
    setCurrentUser(found);

    // Show unread notifications
    const unread = getUnreadNotifications(found.id);
    if (unread.length > 0) {
      setTimeout(() => {
        unread.forEach((n) => toast.info(n.message));
        markNotificationsRead(found.id);
      }, 500);
    }

    return { success: true };
  };

  const signup = (userData: Omit<User, "id" | "role">) => {
    if (findUserByEmail(userData.email)) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }
    const newUser: User = { ...userData, id: crypto.randomUUID(), role: "user" };
    saveUser(newUser);
    setUser(newUser);
    setCurrentUser(newUser);
    return { success: true };
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return { success: false, error: "Non connecté" };
    // Check email uniqueness if changed
    if (data.email && data.email !== user.email) {
      const existing = findUserByEmail(data.email);
      if (existing) return { success: false, error: "Cet email est déjà utilisé" };
    }
    const updated = { ...user, ...data };
    updateUser(user.id, data);
    setUser(updated);
    setCurrentUser(updated);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
