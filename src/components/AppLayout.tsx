import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { getUnreadNotifications, markNotificationsRead } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LayoutDashboard, Send, LogOut, User, Users, UserCog, ClipboardCheck, Languages, Bell } from "lucide-react";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const { t, toggle, lang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [unread, setUnread] = useState<ReturnType<typeof getUnreadNotifications>>([]);

  useEffect(() => {
    if (user) {
      setUnread(getUnreadNotifications(user.id));
    }
  }, [user, location.pathname]);

  const handleMarkRead = () => {
    if (user) {
      markNotificationsRead(user.id);
      setUnread([]);
    }
  };

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/transfer-request", label: t("nav.transfer"), icon: Send },
    { to: "/profile", label: t("nav.profile"), icon: UserCog },
  ];

  const adminNavItems = [
    { to: "/users", label: t("nav.users"), icon: Users },
    { to: "/approvals", label: t("nav.approvals"), icon: ClipboardCheck },
  ];

  const allNavItems = [...navItems, ...(isAdmin ? adminNavItems : [])];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-secondary">{t("app.name.prefix")}</span>{t("app.name.suffix")}
          </Link>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground hover:bg-primary/80 relative"
                >
                  <Bell className="h-4 w-4" />
                  {unread.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unread.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">{lang === "fr" ? "Notifications" : "الإشعارات"}</h4>
                  {unread.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleMarkRead}>
                      {lang === "fr" ? "Tout marquer lu" : "تعليم الكل كمقروء"}
                    </Button>
                  )}
                </div>
                {unread.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{lang === "fr" ? "Aucune notification" : "لا توجد إشعارات"}</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {unread.map((n) => (
                      <div key={n.id} className="text-xs p-2 rounded-md bg-muted">
                        {n.message}
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="text-primary-foreground hover:bg-primary/80 gap-1"
            >
              <Languages className="h-4 w-4" />
              {lang === "fr" ? "العربية" : "Français"}
            </Button>
            <div className="hidden md:flex items-center gap-1 text-sm">
              <User className="h-4 w-4" />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-secondary font-medium ms-1">({user?.grade})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <LogOut className="h-4 w-4 me-1" />
              {t("auth.logout")}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:flex w-60 flex-col bg-card border-e p-4 gap-1">
          {allNavItems.map((item) => {
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
          {allNavItems.map((item) => {
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
