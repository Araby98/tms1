import { useState, useMemo } from "react";
import { getUsers, getWishes } from "@/lib/storage";
import { PROVINCES } from "@/lib/provinces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const UsersList = () => {
  const users = getUsers();
  const wishes = getWishes();

  const [gradeFilter, setGradeFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [destFilter, setDestFilter] = useState("all");

  // Build a map: userId → list of destination provinces
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
      if (originFilter !== "all" && u.fromProvince !== originFilter) return false;
      if (destFilter !== "all") {
        const dests = userDestinations[u.id] || [];
        if (!dests.includes(destFilter)) return false;
      }
      return true;
    });
  }, [users, gradeFilter, originFilter, destFilter, userDestinations]);

  const resetFilters = () => {
    setGradeFilter("all");
    setOriginFilter("all");
    setDestFilter("all");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> Utilisateurs
        </h1>
        <p className="text-muted-foreground">
          {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="administrateur">Administrateur</SelectItem>
                  <SelectItem value="technicien">Technicien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Province d'origine</Label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Province de destination</Label>
              <Select value={destFilter} onValueChange={setDestFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-3">
            Réinitialiser les filtres
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Province d'origine</TableHead>
                <TableHead>Destinations souhaitées</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun utilisateur trouvé
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
