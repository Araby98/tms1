import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUsers, saveTransfer } from "@/lib/storage";
import { PROVINCES } from "@/lib/provinces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";

const MutualTransfer = () => {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState("");
  const [toProvince, setToProvince] = useState("");

  const otherUsers = getUsers().filter((u) => u.id !== user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !toProvince) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const partner = otherUsers.find((u) => u.id === partnerId);
    if (!partner) return;

    saveTransfer({
      id: crypto.randomUUID(),
      type: "mutual",
      status: "pending",
      createdAt: new Date().toISOString(),
      participants: [
        { userId: user!.id, fromProvince: user!.fromProvince, toProvince },
        { userId: partner.id, fromProvince: partner.fromProvince, toProvince: user!.fromProvince },
      ],
    });

    toast.success("Demande de mutation mutuelle créée !");
    setPartnerId("");
    setToProvince("");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" /> Mutation Mutuelle
        </h1>
        <p className="text-muted-foreground">Échange de poste entre 2 personnes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle demande</CardTitle>
          <CardDescription>
            Vous ({user?.firstName} {user?.lastName}) de <strong>{user?.fromProvince}</strong> échangez avec un partenaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Partenaire d'échange</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un utilisateur" /></SelectTrigger>
                <SelectContent>
                  {otherUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.fromProvince} ({u.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Province souhaitée</Label>
              <Select value={toProvince} onValueChange={setToProvince}>
                <SelectTrigger><SelectValue placeholder="Où souhaitez-vous aller ?" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.filter((p) => p !== user?.fromProvince).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Soumettre la demande</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MutualTransfer;
