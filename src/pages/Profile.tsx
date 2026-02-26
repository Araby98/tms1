import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Grade } from "@/lib/types";
import { REGIONS, getProvincesByRegion } from "@/lib/provinces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    grade: (user?.grade || "") as Grade,
    region: user?.region || "",
    fromProvince: user?.fromProvince || "",
  });

  const availableProvinces = form.region ? getProvincesByRegion(form.region) : [];

  const update = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "region") next.fromProvince = "";
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.grade || !form.region || !form.fromProvince) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const result = updateProfile(form);
    if (result.success) {
      toast.success("Profil mis à jour avec succès !");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6" /> Mon profil
        </h1>
        <p className="text-muted-foreground">Modifier vos informations personnelles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Mettez à jour votre profil ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={form.grade} onValueChange={(v) => update("grade", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrateur">Administrateur</SelectItem>
                  <SelectItem value="technicien">Technicien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Région</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner la région" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Province d'origine</Label>
              <Select value={form.fromProvince} onValueChange={(v) => update("fromProvince", v)} disabled={!form.region}>
                <SelectTrigger><SelectValue placeholder={form.region ? "Sélectionner la province" : "Choisir d'abord une région"} /></SelectTrigger>
                <SelectContent>
                  {availableProvinces.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Enregistrer les modifications</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
