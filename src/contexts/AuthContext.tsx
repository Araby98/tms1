import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/lib/types";
import { getCurrentUser, setCurrentUser, findUserByEmail, saveUser } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (userData: Omit<User, "id">) => { success: boolean; error?: string };
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
    return { success: true };
  };

  const signup = (userData: Omit<User, "id">) => {
    if (findUserByEmail(userData.email)) {
      return { success: false, error: "Cet email est déjà utilisé" };
    }
    const newUser: User = { ...userData, id: crypto.randomUUID() };
    saveUser(newUser);
    setUser(newUser);
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
