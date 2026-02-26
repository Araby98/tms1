import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Send, LogOut, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/transfer-request", label: "Demande de mutation", icon: Send },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-secondary">Mouv</span>ement
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 text-sm">
              <User className="h-4 w-4" />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-secondary font-medium ml-1">({user?.grade})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:flex w-60 flex-col bg-card border-r p-4 gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex z-50">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center py-2 text-xs ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 mb-0.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
};
