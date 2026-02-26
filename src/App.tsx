import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MutualTransfer from "./pages/MutualTransfer";
import CycleTransfer from "./pages/CycleTransfer";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mutual-transfer" element={<ProtectedRoute><MutualTransfer /></ProtectedRoute>} />
            <Route path="/cycle-transfer" element={<ProtectedRoute><CycleTransfer /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
