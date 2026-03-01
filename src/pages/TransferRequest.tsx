import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { apiGetWishes, apiCreateWish, apiDeleteWish, apiUpdateWish } from "@/lib/api";
import { TransferWish } from "@/lib/types";
import { REGIONS, getProvincesByRegion } from "@/lib/provinces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, ArrowRight, ArrowLeftRight, Trash2, Edit2, X, Check } from "lucide-react";

const TransferRequest = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [toRegion, setToRegion] = useState("");
  const [toProvince, setToProvince] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRegion, setEditRegion] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [myWishes, setMyWishes] = useState<TransferWish[]>([]);

  const availableProvinces = toRegion ? getProvincesByRegion(toRegion) : [];

  const loadWishes = async () => {
    if (!user) return;
    const wishes = await apiGetWishes(user.id);
    setMyWishes(wishes);
  };

  useEffect(() => { loadWishes(); }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toProvince || toProvince === user?.fromProvince) return;

    try {
      const { match } = await apiCreateWish({
        userId: user!.id,
        fromProvince: user!.fromProvince,
        toProvince,
      });

      if (match) {
        toast.success(match.type === "mutual" ? "🎉 Mutation mutuelle détectée !" : "🎉 Mutation cyclique détectée !");
      } else {
        toast.success(t("dash.pending"));
      }
      setToRegion("");
      setToProvince("");
      loadWishes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    await apiDeleteWish(id);
    loadWishes();
  };

  const handleEditSave = async (wishId: string, fromProvince: string) => {
    if (!editProvince || editProvince === fromProvince) return;
    await apiUpdateWish(wishId, { toProvince: editProvince });
    setEditingId(null);
    loadWishes();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6" /> {t("transfer.title")}
        </h1>
        <p className="text-muted-foreground">{t("transfer.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("transfer.new")}</CardTitle>
          <CardDescription>
            {t("transfer.current_at")} <strong>{user?.fromProvince}</strong>. {t("transfer.where")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.region")}</Label>
              <Select value={toRegion} onValueChange={(v) => { setToRegion(v); setToProvince(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("auth.select_region")} />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("transfer.dest")}</Label>
              <Select value={toProvince} onValueChange={setToProvince} disabled={!toRegion}>
                <SelectTrigger>
                  <SelectValue placeholder={toRegion ? t("transfer.select_province") : t("auth.choose_region_first")} />
                </SelectTrigger>
                <SelectContent>
                  {availableProvinces.filter((p) => p !== user?.fromProvince).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              <Send className="h-4 w-4 me-2" /> {t("transfer.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("transfer.my_requests")}</CardTitle>
        </CardHeader>
        <CardContent>
          {myWishes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("dash.no_requests")}</p>
          ) : (
            <div className="space-y-3">
              {myWishes.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div>
                      {editingId === w.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{w.fromProvince} →</span>
                          <Select value={editRegion} onValueChange={(v) => { setEditRegion(v); setEditProvince(""); }}>
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue placeholder={t("auth.region")} />
                            </SelectTrigger>
                            <SelectContent>
                              {REGIONS.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={editProvince} onValueChange={setEditProvince} disabled={!editRegion}>
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue placeholder={t("auth.province")} />
                            </SelectTrigger>
                            <SelectContent>
                              {(editRegion ? getProvincesByRegion(editRegion) : []).filter((p) => p !== user?.fromProvince).map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditSave(w.id, w.fromProvince)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium">{w.fromProvince} → {w.toProvince}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(w.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.matchedTransferId ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <ArrowLeftRight className="h-3 w-3" /> {t("dash.matched")}
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline">{t("dash.pending")}</Badge>
                        {editingId !== w.id && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(w.id); setEditRegion(""); setEditProvince(w.toProvince); }}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(w.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferRequest;
