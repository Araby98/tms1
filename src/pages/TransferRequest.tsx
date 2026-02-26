import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getWishes, saveWish, hasExistingWish, tryAutoMatch, deleteWish, updateWish } from "@/lib/storage";
import { PROVINCES } from "@/lib/provinces";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, ArrowRight, ArrowLeftRight, Trash2, Edit2, X, Check } from "lucide-react";

const TransferRequest = () => {
  const { user } = useAuth();
  const [toProvince, setToProvince] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProvince, setEditProvince] = useState("");
  const [, forceUpdate] = useState(0);

  const myWishes = getWishes().filter((w) => w.userId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toProvince) {
      toast.error("Veuillez sélectionner une province de destination");
      return;
    }
    if (toProvince === user?.fromProvince) {
      toast.error("La destination doit être différente de votre province actuelle");
      return;
    }
    if (hasExistingWish(user!.id, user!.fromProvince, toProvince)) {
      toast.error("Vous avez déjà une demande identique en cours");
      return;
    }

    const wish = {
      id: crypto.randomUUID(),
      userId: user!.id,
      fromProvince: user!.fromProvince,
      toProvince,
      createdAt: new Date().toISOString(),
    };
    saveWish(wish);

    const match = tryAutoMatch(wish);
    if (match) {
      toast.success(
        match.type === "mutual"
          ? "🎉 Mutation mutuelle détectée automatiquement !"
          : "🎉 Mutation cyclique détectée automatiquement !"
      );
    } else {
      toast.success("Demande enregistrée. Un match sera détecté automatiquement.");
    }
    setToProvince("");
    forceUpdate((n) => n + 1);
  };

  const handleDelete = (id: string) => {
    deleteWish(id);
    toast.success("Demande supprimée");
    forceUpdate((n) => n + 1);
  };

  const handleEdit = (wishId: string, currentTo: string) => {
    setEditingId(wishId);
    setEditProvince(currentTo);
  };

  const handleEditSave = (wishId: string, fromProvince: string) => {
    if (!editProvince || editProvince === fromProvince) {
      toast.error("Province de destination invalide");
      return;
    }
    if (hasExistingWish(user!.id, fromProvince, editProvince)) {
      toast.error("Vous avez déjà une demande identique en cours");
      return;
    }
    updateWish(wishId, { toProvince: editProvince });
    setEditingId(null);
    toast.success("Demande modifiée");
    forceUpdate((n) => n + 1);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6" /> Demande de mutation
        </h1>
        <p className="text-muted-foreground">
          Indiquez votre destination souhaitée. Les mutations mutuelles et cycliques seront détectées automatiquement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle demande</CardTitle>
          <CardDescription>
            Vous êtes actuellement à <strong>{user?.fromProvince}</strong>. Où souhaitez-vous aller ?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Province de destination</Label>
              <Select value={toProvince} onValueChange={setToProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.filter((p) => p !== user?.fromProvince).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              <Send className="h-4 w-4 mr-2" /> Soumettre
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes demandes</CardTitle>
        </CardHeader>
        <CardContent>
          {myWishes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune demande pour le moment.</p>
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
                          <Select value={editProvince} onValueChange={setEditProvince}>
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVINCES.filter((p) => p !== user?.fromProvince).map((p) => (
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
                        <ArrowLeftRight className="h-3 w-3" /> Matchée
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline">En attente</Badge>
                        {editingId !== w.id && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(w.id, w.toProvince)}>
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
