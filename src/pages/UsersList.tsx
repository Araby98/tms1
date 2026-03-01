import { useState, useMemo, useEffect } from "react";
import { apiGetUsers, apiGetWishes } from "@/lib/api";
import { User, TransferWish } from "@/lib/types";
import { useLang } from "@/contexts/LanguageContext";
import { PROVINCES, REGIONS } from "@/lib/provinces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const UsersList = () => {
  const { t } = useLang();
  const [users, setUsers] = useState<User[]>([]);
  const [wishes, setWishes] = useState<TransferWish[]>([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const [us, wi] = await Promise.all([apiGetUsers(), apiGetWishes()]);
      setUsers(us);
      setWishes(wi);
    };
    load();
  }, []);

  const userDestinations = useMemo(() => {
    const map: Record<string, string[]> = {};
    wishes.forEach((w) => {
      if (!w.matchedTransferId) {
        if (!map[w.userId]) map[w.userId] = [];
        if (!map[w.userId].includes(w.toProvince)) map[w.userId].push(w.toProvince);
      }
    });
    return map;
  }, [wishes]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (gradeFilter !== "all" && u.grade !== gradeFilter) return false;
      if (regionFilter !== "all" && u.region !== regionFilter) return false;
      if (originFilter !== "all" && u.fromProvince !== originFilter) return false;
      if (destFilter !== "all") {
        const dests = userDestinations[u.id] || [];
        if (!dests.includes(destFilter)) return false;
      }
      return true;
    });
  }, [users, gradeFilter, regionFilter, originFilter, destFilter, userDestinations]);

  const resetFilters = () => {
    setGradeFilter("all");
    setRegionFilter("all");
    setOriginFilter("all");
    setDestFilter("all");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> {t("users.title")}
        </h1>
        <p className="text-muted-foreground">
          {filtered.length} {t("users.found")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> {t("users.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t("auth.grade")}</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("users.all")}</SelectItem>
                  <SelectItem value="administrateur">{t("auth.admin_label")}</SelectItem>
                  <SelectItem value="technicien">{t("auth.tech_label")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.region")}</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("users.all_f")}</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.province")}</Label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("users.all_f")}</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("transfer.dest")}</Label>
              <Select value={destFilter} onValueChange={setDestFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("users.all_f")}</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-3">
            {t("users.reset_filters")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.name")}</TableHead>
                <TableHead>{t("auth.email")}</TableHead>
                <TableHead>{t("auth.grade")}</TableHead>
                <TableHead>{t("auth.region")}</TableHead>
                <TableHead>{t("auth.province")}</TableHead>
                <TableHead>{t("users.dest_wished")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("users.none_found")}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.grade}</Badge>
                    </TableCell>
                    <TableCell>{u.region}</TableCell>
                    <TableCell>{u.fromProvince}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(userDestinations[u.id] || []).map((d) => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                        {!(userDestinations[u.id]?.length) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList;
