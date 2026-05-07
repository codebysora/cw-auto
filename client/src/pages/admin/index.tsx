import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, Ban, BarChart3, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

type Overview = {
  users: { total: number; pending: number; allowed: number; blocked: number; admins: number };
  blockedClientsCount: number;
  analytics: {
    totalBidCount: number;
    totalMessageCount: number;
    totalContactCount: number;
    totalJobsPosted: number;
    chartSeries: { date: string; bidCount: number; messageCount: number; contactCount: number }[];
  };
  recentPending: {
    id: string;
    fullName?: string;
    telegramId: number;
    telegramUsername?: string;
    createdAt?: string;
  }[];
};

export default function AdminDashboard() {
  const { telegramUser } = useAuth();
  const telegramId = telegramUser?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!telegramId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const body = await apiClient.get("/api/admin/overview", { telegramId });
        const data = body?.data as Overview;
        if (!cancelled) setOverview(data || null);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.error || e?.message || "Failed to load overview");
          setOverview(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [telegramId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error || "No data"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = overview.analytics.chartSeries.map((r) => ({
    date: r.date.slice(5),
    bids: r.bidCount,
    messages: r.messageCount,
    contacts: r.contactCount,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Live counts from your database</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="card-stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.users.total}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-allowed">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allowed</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.users.allowed}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.users.pending}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-blocked-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.users.blocked}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-blocked-clients">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked CW clients</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.blockedClientsCount}</div>
            <Link href="/admin/blocked-clients" className="text-xs text-primary underline-offset-4 hover:underline">
              Manage
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total bids (analytics)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.analytics.totalBidCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.analytics.totalMessageCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.analytics.totalContactCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.users.admins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Bids & messages by day
            </CardTitle>
            <CardDescription>From stored analytics rows (date)</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No analytics rows yet.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="bids" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Bids" />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts by day</CardTitle>
            <CardDescription>Same series, contact count</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No analytics rows yet.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="contacts" fill="hsl(var(--chart-1))" name="Contacts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>Newest first — open User Management to act</CardDescription>
          </div>
          <Link href="/admin/users" className="text-sm text-primary hover:underline">
            User management →
          </Link>
        </CardHeader>
        <CardContent>
          {overview.recentPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending users.</p>
          ) : (
            <ul className="space-y-2">
              {overview.recentPending.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{u.fullName || `User ${u.telegramId}`}</p>
                    <p className="text-xs text-muted-foreground">
                      TG {u.telegramId}
                      {u.telegramUsername ? ` · @${u.telegramUsername}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
