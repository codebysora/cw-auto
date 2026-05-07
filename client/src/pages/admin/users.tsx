import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserCheck, UserX, Clock, Trash2, Shield, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

type ApiUser = {
  id: string;
  telegramId: number;
  fullName?: string;
  telegramUsername?: string;
  email?: string;
  status?: number | string;
  role?: string;
  createdAt?: string;
};

function statusToUi(status: unknown): "allowed" | "pending" | "blocked" {
  if (typeof status === "number") {
    if (status === 1) return "allowed";
    if (status === 2 || status === -1) return "blocked";
    return "pending";
  }
  if (typeof status === "boolean") return status ? "allowed" : "pending";
  if (typeof status === "string") {
    const n = status.trim().toLowerCase();
    if (["1", "allowed", "active", "approved", "true"].includes(n)) return "allowed";
    if (["2", "blocked", "denied", "rejected"].includes(n)) return "blocked";
    if (["0", "pending", ""].includes(n)) return "pending";
  }
  return "pending";
}

function uiStatusToApi(ui: string): number | string {
  if (ui === "allowed") return 1;
  if (ui === "blocked") return 2;
  return 0;
}

export default function UserManagement() {
  const { telegramUser } = useAuth();
  const telegramId = telegramUser?.id;
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manageUserId, setManageUserId] = useState<string | null>(null);
  const [dialogStatus, setDialogStatus] = useState<string>("pending");
  const [dialogRole, setDialogRole] = useState<string>("user");
  const [saving, setSaving] = useState(false);

  const editingUser = useMemo(() => users.find((u) => u.id === manageUserId) || null, [users, manageUserId]);

  const loadUsers = useCallback(async () => {
    if (!telegramId) return;
    setLoading(true);
    try {
      const list = (await apiClient.get("/api/admin/users", { telegramId })) as ApiUser[];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || e?.message || "Failed to load users",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!editingUser) return;
    setDialogStatus(statusToUi(editingUser.status));
    setDialogRole(
      editingUser.role === "admin" || editingUser.role === "superadmin" ? editingUser.role : "user"
    );
  }, [editingUser]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const ui = statusToUi(user.status);
      const name = (user.fullName || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const tg = (user.telegramUsername || "").toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || tg.includes(q);
      const matchesStatus = statusFilter === "all" || ui === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const openManage = (user: ApiUser) => {
    setManageUserId(user.id);
    setDialogStatus(statusToUi(user.status));
    setDialogRole(user.role === "admin" || user.role === "superadmin" ? user.role : "user");
  };

  const persistUser = async (userId: string, body: Record<string, unknown>) => {
    if (!telegramId) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/admin/users/${userId}`, { telegramId, ...body });
      toast({ title: "Saved", description: "User updated." });
      await loadUsers();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || e?.message || "Update failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDialog = async () => {
    if (!manageUserId) return;
    await persistUser(manageUserId, {
      status: uiStatusToApi(dialogStatus),
      role: dialogRole,
    });
    setManageUserId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!telegramId) return;
    if (!confirm("Delete this user permanently?")) return;
    try {
      await apiClient.delete(`/api/admin/users/${userId}`, { params: { telegramId } });
      toast({ title: "Deleted", description: "User removed." });
      await loadUsers();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || e?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: unknown) => {
    const ui = statusToUi(status);
    switch (ui) {
      case "allowed":
        return (
          <Badge variant="default" className="bg-green-600">
            Allowed
          </Badge>
        );
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          User Management
        </h1>
        <p className="text-muted-foreground">Approve, block, set roles — changes are saved to the database</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allowed</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => statusToUi(u.status) === "allowed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => statusToUi(u.status) === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => statusToUi(u.status) === "blocked").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "admin" || u.role === "superadmin").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User list</CardTitle>
          <CardDescription>Search and filter</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="allowed">Allowed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Telegram ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover-elevate" data-testid={`row-user-${user.id}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {(user.fullName || "U").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.fullName || `User ${user.telegramId}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.telegramUsername ? `@${user.telegramUsername}` : "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{user.telegramId}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.email || "—"}</td>
                    <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === "admin" || user.role === "superadmin" ? "default" : "secondary"}>
                        {user.role || "user"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm" onClick={() => openManage(user)} data-testid={`button-manage-user-${user.id}`}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!manageUserId} onOpenChange={(open) => !open && setManageUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage user</DialogTitle>
            <DialogDescription>
              {editingUser?.fullName || editingUser?.telegramId} — updates save to the server
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={dialogStatus} onValueChange={setDialogStatus}>
                    <SelectTrigger data-testid="select-user-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">Allowed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={dialogRole} onValueChange={setDialogRole}>
                    <SelectTrigger data-testid="select-user-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleDeleteUser(editingUser.id);
                    setManageUserId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={handleSaveDialog} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
