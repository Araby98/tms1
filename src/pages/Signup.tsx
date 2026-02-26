import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Grade } from "@/lib/types";
import { REGIONS, getProvincesByRegion } from "@/lib/provinces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Signup = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    grade: "" as Grade,
    region: "",
    fromProvince: "",
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const availableProvinces = form.region ? getProvincesByRegion(form.region) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grade || !form.region || !form.fromProvince) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const result = signup(form);
    if (result.success) {
      toast.success("Inscription réussie !");
      navigate("/dashboard");
    } else {
      toast.error(result.error);
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "region") next.fromProvince = "";
      return next;
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-secondary">Mouv</span>ement
          </CardTitle>
          <CardDescription>Créer un nouveau compte</CardDescription>
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
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
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
            <Button type="submit" className="w-full">S'inscrire</Button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
