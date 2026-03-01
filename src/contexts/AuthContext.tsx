import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, Notification } from "@/lib/types";
import { apiLogin, apiSignup, apiUpdateUser, apiMarkNotificationsRead } from "@/lib/api";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: Omit<User, "id" | "role">) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);

      // Show unread notifications
      if (data.unreadNotifications?.length > 0) {
        setTimeout(() => {
          data.unreadNotifications.forEach((n: Notification) => toast.info(n.message));
          apiMarkNotificationsRead(data.user.id);
        }, 500);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signup = async (userData: Omit<User, "id" | "role">) => {
    try {
      const data = await apiSignup(userData);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { success: false, error: "Non connecté" };
    try {
      const result = await apiUpdateUser(user.id, data);
      setUser(result.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
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
