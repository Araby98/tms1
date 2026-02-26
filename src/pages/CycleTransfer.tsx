import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUsers, saveTransfer } from "@/lib/storage";
import { PROVINCES } from "@/lib/provinces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";

const CycleTransfer = () => {
  const { user } = useAuth();
  const [partner1Id, setPartner1Id] = useState("");
  const [partner2Id, setPartner2Id] = useState("");
  const [toProvince, setToProvince] = useState("");

  const otherUsers = getUsers().filter((u) => u.id !== user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner1Id || !partner2Id || !toProvince) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (partner1Id === partner2Id) {
      toast.error("Les partenaires doivent être différents");
      return;
    }

    const p1 = otherUsers.find((u) => u.id === partner1Id);
    const p2 = otherUsers.find((u) => u.id === partner2Id);
    if (!p1 || !p2) return;

    // Cycle: A→B→C→A
    // user goes to toProvince, p1 goes to p2's province, p2 goes to user's province
    saveTransfer({
      id: crypto.randomUUID(),
      type: "cycle",
      status: "pending",
      createdAt: new Date().toISOString(),
      participants: [
        { userId: user!.id, fromProvince: user!.fromProvince, toProvince },
        { userId: p1.id, fromProvince: p1.fromProvince, toProvince: p2.fromProvince },
        { userId: p2.id, fromProvince: p2.fromProvince, toProvince: user!.fromProvince },
      ],
    });

    toast.success("Demande de mutation cyclique créée !");
    setPartner1Id("");
    setPartner2Id("");
    setToProvince("");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCw className="h-6 w-6" /> Mutation Cyclique
        </h1>
        <p className="text-muted-foreground">Rotation de postes entre 3 personnes (A→B→C→A)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle demande</CardTitle>
          <CardDescription>
            Vous ({user?.firstName} {user?.lastName}) de <strong>{user?.fromProvince}</strong> participez à un cycle de 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Partenaire B</Label>
              <Select value={partner1Id} onValueChange={setPartner1Id}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le 2ème participant" /></SelectTrigger>
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
              <Label>Partenaire C</Label>
              <Select value={partner2Id} onValueChange={setPartner2Id}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le 3ème participant" /></SelectTrigger>
                <SelectContent>
                  {otherUsers.filter((u) => u.id !== partner1Id).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.fromProvince} ({u.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Province souhaitée (pour vous)</Label>
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

export default CycleTransfer;
