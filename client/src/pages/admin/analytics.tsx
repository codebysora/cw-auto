import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, MessageSquare, Phone, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

type AnalyticsRow = {
  id: string;
  userId: string;
  date: string;
  bidCount?: number;
  messageCount?: number;
  contactCount?: number;
  jobsPosted?: number;
};

function rowDayKey(dateVal: unknown): string {
  if (dateVal == null) return "";
  if (typeof dateVal === "string") return dateVal.slice(0, 10);
  const d = new Date(dateVal as Date);
  if (Number.isNaN(d.getTime())) return String(dateVal).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export default function AdminAnalytics() {
  const { telegramUser } = useAuth();
  const telegramId = telegramUser?.id;
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!telegramId) return;
    setLoading(true);
    try {
      const data = (await apiClient.get("/api/admin/analytics", { telegramId })) as AnalyticsRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || e?.message || "Failed to load analytics",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    let bids = 0;
    let messages = 0;
    let contacts = 0;
    let jobs = 0;
    for (const r of rows) {
      bids += r.bidCount ?? 0;
      messages += r.messageCount ?? 0;
      contacts += r.contactCount ?? 0;
      jobs += r.jobsPosted ?? 0;
    }
    return { bids, messages, contacts, jobs };
  }, [rows]);

  const chartData = useMemo(() => {
    const by = new Map<string, { day: string; bids: number; messages: number; contacts: number }>();
    for (const r of rows) {
      const day = rowDayKey(r.date);
      if (!day) continue;
      const cur = by.get(day) || { day, bids: 0, messages: 0, contacts: 0 };
      cur.bids += r.bidCount ?? 0;
      cur.messages += r.messageCount ?? 0;
      cur.contacts += r.contactCount ?? 0;
      by.set(day, cur);
    }
    return Array.from(by.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [rows]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            System analytics
          </h1>
          <p className="text-muted-foreground">All analytics rows in the database (per user / date)</p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="button-export" onClick={exportJson} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total bids</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.bids}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.messages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.contacts}</div>
            <p className="text-xs text-muted-foreground mt-1">Jobs posted (sum): {totals.jobs}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily totals</CardTitle>
          <CardDescription>Aggregated from all analytics rows by calendar day</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No analytics data yet.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
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
                  <Line type="monotone" dataKey="messages" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Messages" />
                  <Line type="monotone" dataKey="contacts" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Contacts" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw rows</CardTitle>
          <CardDescription>Newest first (up to 200)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">User ID</th>
                  <th className="text-right py-2 px-2">Bids</th>
                  <th className="text-right py-2 px-2">Msgs</th>
                  <th className="text-right py-2 px-2">Contacts</th>
                  <th className="text-right py-2 px-2">Jobs</th>
                </tr>
              </thead>
              <tbody>
                {[...rows]
                  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                  .slice(0, 200)
                  .map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 px-2 font-mono text-xs">{rowDayKey(r.date)}</td>
                      <td className="py-2 px-2 font-mono text-xs truncate max-w-[140px]">{r.userId}</td>
                      <td className="py-2 px-2 text-right">{r.bidCount ?? 0}</td>
                      <td className="py-2 px-2 text-right">{r.messageCount ?? 0}</td>
                      <td className="py-2 px-2 text-right">{r.contactCount ?? 0}</td>
                      <td className="py-2 px-2 text-right">{r.jobsPosted ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
