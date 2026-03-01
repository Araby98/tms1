import { useState, useEffect } from "react";
import { apiGetTransfers, apiGetUsers, apiUpdateTransfer, apiCreateNotification } from "@/lib/api";
import { User, TransferRequest } from "@/lib/types";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, ClipboardCheck, ArrowLeftRight, RotateCw } from "lucide-react";
import { toast } from "sonner";

const TransferApprovals = () => {
  const { t } = useLang();
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const load = async () => {
    const [tr, us] = await Promise.all([apiGetTransfers(), apiGetUsers()]);
    setTransfers(tr);
    setUsers(us);
  };

  useEffect(() => { load(); }, []);

  const getUserName = (id: string) => {
    const u = users.find((u) => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : t("common.unknown");
  };

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    await apiUpdateTransfer(id, { status });
    const transfer = transfers.find((t) => t.id === id);
    if (transfer) {
      const msg = status === "approved"
        ? "🎉 Une correspondance a été trouvée pour votre demande de mutation ! Consultez votre tableau de bord. / تم العثور على تطابق لطلب تنقلك! تحقق من لوحة التحكم."
        : "❌ Votre demande de mutation n'a pas abouti. / لم يتم قبول طلب تنقلك.";
      for (const p of transfer.participants) {
        await apiCreateNotification({
          id: crypto.randomUUID(),
          userId: p.userId,
          message: msg,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
    }
    toast.success(status === "approved" ? t("approvals.approved_success") : t("approvals.rejected_success"));
    load();
  };

  const pendingTransfers = transfers.filter((t) => t.status === "pending");
  const processedTransfers = transfers.filter((t) => t.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> {t("approvals.title")}
        </h1>
        <p className="text-muted-foreground">{t("approvals.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dash.pending")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingTransfers.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">{t("approvals.no_pending")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("approvals.type")}</TableHead>
                  <TableHead>{t("approvals.participants")}</TableHead>
                  <TableHead>{t("approvals.date")}</TableHead>
                  <TableHead>{t("approvals.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransfers.map((tr) => (
                  <TableRow key={tr.id}>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        {tr.type === "mutual" ? <ArrowLeftRight className="h-3 w-3" /> : <RotateCw className="h-3 w-3" />}
                        {tr.type === "mutual" ? t("dash.mutual") : t("dash.cycle")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tr.participants.map((p, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{getUserName(p.userId)}</span>
                            <span className="text-muted-foreground"> ({p.fromProvince} → {p.toProvince})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tr.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleAction(tr.id, "approved")} className="gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> {t("approvals.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(tr.id, "rejected")} className="gap-1">
                          <XCircle className="h-3.5 w-3.5" /> {t("approvals.reject")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {processedTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("approvals.status")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("approvals.type")}</TableHead>
                  <TableHead>{t("approvals.participants")}</TableHead>
                  <TableHead>{t("approvals.status")}</TableHead>
                  <TableHead>{t("approvals.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedTransfers.map((tr) => (
                  <TableRow key={tr.id}>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        {tr.type === "mutual" ? <ArrowLeftRight className="h-3 w-3" /> : <RotateCw className="h-3 w-3" />}
                        {tr.type === "mutual" ? t("dash.mutual") : t("dash.cycle")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {tr.participants.map((p, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{getUserName(p.userId)}</span>
                            <span className="text-muted-foreground"> ({p.fromProvince} → {p.toProvince})</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tr.status === "approved" ? "default" : "destructive"}>
                        {tr.status === "approved" ? t("dash.approved") : t("dash.rejected")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tr.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransferApprovals;
