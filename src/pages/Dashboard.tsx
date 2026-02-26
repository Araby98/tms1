import { useAuth } from "@/contexts/AuthContext";
import { getTransfers, getUsers } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, RotateCw, Users, Clock } from "lucide-react";

const statusLabel: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const Dashboard = () => {
  const { user } = useAuth();
  const transfers = getTransfers();
  const users = getUsers();

  const myTransfers = transfers.filter((t) =>
    t.participants.some((p) => p.userId === user?.id)
  );

  const getUserName = (id: string) => {
    const u = users.find((u) => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "Inconnu";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenue, {user?.firstName}</h1>
        <p className="text-muted-foreground">Province: {user?.fromProvince} · Grade: {user?.grade}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-secondary/30">
              <ArrowLeftRight className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transfers.filter((t) => t.type === "mutual").length}</p>
              <p className="text-sm text-muted-foreground">Mutations mutuelles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="p-3 rounded-lg bg-secondary/30">
              <RotateCw className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transfers.filter((t) => t.type === "cycle").length}</p>
              <p className="text-sm text-muted-foreground">Mutations cycliques</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Mes demandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myTransfers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune demande pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {myTransfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {t.type === "mutual" ? (
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {t.type === "mutual" ? "Mutation mutuelle" : "Mutation cyclique"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.participants.map((p) => `${getUserName(p.userId)} (${p.fromProvince} → ${p.toProvince})`).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
