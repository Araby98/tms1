import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
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
    firstName: "", lastName: "", email: "", password: "",
    grade: "" as Grade, region: "", fromProvince: "",
  });
  const { signup } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const availableProvinces = form.region ? getProvincesByRegion(form.region) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grade || !form.region || !form.fromProvince) {
      toast.error(t("common.fill_all"));
      return;
    }
    const result = await signup(form);
    if (result.success) {
      toast.success(t("auth.signup_success"));
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
            <span className="text-secondary">{t("app.name.prefix")}</span>{t("app.name.suffix")}
          </CardTitle>
          <CardDescription>{t("auth.create_account")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.grade")}</Label>
              <Select value={form.grade} onValueChange={(v) => update("grade", v)}>
                <SelectTrigger><SelectValue placeholder={t("auth.select_grade")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrateur">{t("auth.admin_label")}</SelectItem>
                  <SelectItem value="technicien">{t("auth.tech_label")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.region")}</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v)}>
                <SelectTrigger><SelectValue placeholder={t("auth.select_region")} /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.province")}</Label>
              <Select value={form.fromProvince} onValueChange={(v) => update("fromProvince", v)} disabled={!form.region}>
                <SelectTrigger><SelectValue placeholder={form.region ? t("auth.select_province") : t("auth.choose_region_first")} /></SelectTrigger>
                <SelectContent>
                  {availableProvinces.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">{t("auth.signup")}</Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.has_account")}{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">{t("auth.login")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
