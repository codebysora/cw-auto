import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import api from "@/lib/api";
import { Calendar as CalendarIcon, BarChart3, Clock, Wallet, Loader2, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const BUDGET_COLORS: Record<string, string> = {
  "100万円+": "hsl(var(--chart-1))",
  "50万円~100万円": "hsl(var(--chart-2))",
  "30万円~50万円": "hsl(var(--chart-3))",
  "10万円~30万円": "hsl(var(--chart-4))",
  "5万円~10万円": "hsl(var(--chart-5))",
  "3万円": "hsl(220 70% 50%)",
  "???": "hsl(0 0% 45%)",
  "H: 5千円": "hsl(280 60% 55%)",
  "H: 3千円~5千円": "hsl(160 60% 45%)",
  "H: 1千円~3千円": "hsl(40 80% 50%)",
};

const CW_CLIENT_URL = "https://crowdworks.jp/public/employers/";
const CW_JOB_URL = "https://crowdworks.jp/public/jobs/";

interface TimeIntervalRow {
  timeRange: string;
  budgetCounts: { [key: string]: number };
  sum: number;
}

interface JobStatsByDate {
  date: string;
  budgetRanges: string[];
  rows: TimeIntervalRow[];
  totalJobs: number;
}

interface ClientJobItem {
  id: number;
  title: string;
  jobType: string;
  lowBudget: number;
  highBudget: number;
  createdAt: string;
  budgetRange: string;
}

interface ClientSummary {
  clientId: number;
  clientName: string;
  clientAvatar?: string;
  jobCount: number;
  jobs: ClientJobItem[];
}

function formatDateForInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PERIOD_OPTIONS = [
  { label: "Single day", value: "single_day" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
  { label: "This month", value: "this_month" },
  { label: "Custom range", value: "custom" },
];
const DATA_SOURCE_OPTIONS = [
  { label: "Database", value: "db" },
  { label: "Saved file (CSV)", value: "file" },
];

export default function TaskStatus() {
  const [dataSource, setDataSource] = useState<"db" | "file">("db");
  const [period, setPeriod] = useState<string>("single_day");
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateForInput(new Date()));
  const [startDate, setStartDate] = useState<string>(() => formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState<string>(() => formatDateForInput(new Date()));
  const [data, setData] = useState<JobStatsByDate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState<{ timeRange?: string; budgetRange?: string } | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientList, setClientList] = useState<ClientSummary[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/jobs/csv-dates")
      .then((res: { data: string[] }) => setAvailableDates(res.data || []))
      .catch(() => setAvailableDates([]));
  }, []);

  useEffect(() => {
    setError(null);
    if (period === "single_day") {
      if (!selectedDate) return;
      setLoading(true);
      const params: Record<string, string> = { date: selectedDate };
      if (dataSource === "file") params.source = "file";
      apiClient
        .get("/api/jobs/by-date-csv", params)
        .then((res: { data: JobStatsByDate }) => {
          setData(res.data);
          // In DB mode, this endpoint writes CSV for the selected date.
          // Keep local date list in sync so download state is accurate.
          if (dataSource === "db" && selectedDate) {
            setAvailableDates((prev) => (prev.includes(selectedDate) ? prev : [...prev, selectedDate]));
          }
        })
        .catch((err: any) => {
          setError(err?.response?.data?.error || err?.message || "Failed to load");
          setData(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      const params: Record<string, string> = { period };
      if (period === "custom") {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      apiClient
        .get("/api/jobs/by-period-csv", params)
        .then((res: { data: JobStatsByDate }) => setData(res.data))
        .catch((err: any) => {
          setError(err?.response?.data?.error || err?.message || "Failed to load");
          setData(null);
        })
        .finally(() => setLoading(false));
    }
  }, [period, selectedDate, startDate, endDate, dataSource]);

  const handleDownloadCSV = async () => {
    if (!selectedDate) return;
    setDownloading(true);
    try {
      const res = await api.get("/api/jobs/csv-file", {
        params: { date: selectedDate },
        responseType: "blob",
        headers: {
          Accept: "text/csv",
        },
      });

      const contentType = String(res.headers?.["content-type"] || "").toLowerCase();
      if (contentType.includes("text/html")) {
        throw new Error("Downloaded HTML instead of CSV. Please check API base URL/proxy.");
      }

      const blob = res.data as Blob;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `jobs_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      setError(e?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const hasCSVForSelectedDate = availableDates.includes(selectedDate);
  const canDownloadCSV = Boolean(
    period === "single_day" &&
      selectedDate &&
      (dataSource === "db" || hasCSVForSelectedDate)
  );

  const fetchClientsForFilter = async (filter: { timeRange?: string; budgetRange?: string }) => {
    if (!data) return;
    setClientFilter(filter);
    setClientLoading(true);
    try {
      const scope = period === "single_day" ? "single_day" : "period";
      const params: Record<string, string> = { scope };
      if (scope === "single_day") {
        params.date = selectedDate;
      } else {
        params.period = period;
        if (period === "custom") {
          params.startDate = startDate;
          params.endDate = endDate;
        }
      }
      if (filter.timeRange) params.timeRange = filter.timeRange;
      if (filter.budgetRange) params.budgetRange = filter.budgetRange;
      const res = await apiClient.get("/api/jobs/clients-by-graph", params);
      setClientList(res.data?.clients || []);
      setClientDialogOpen(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Failed to load clients");
    } finally {
      setClientLoading(false);
    }
  };

  const chartByTime = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows
      .filter((r) => r.sum > 0)
      .map((r) => ({ time: r.timeRange, jobs: r.sum, full: r.timeRange }));
  }, [data]);

  const chartByBudget = useMemo(() => {
    if (!data?.rows || !data?.budgetRanges) return [];
    const totals: Record<string, number> = {};
    data.budgetRanges.forEach((range) => (totals[range] = 0));
    data.rows.forEach((row) => {
      data.budgetRanges.forEach((range) => {
        const n = row.budgetCounts?.[range];
        if (typeof n === "number") totals[range] += n;
      });
    });
    return data.budgetRanges
      .map((range) => ({ name: range, value: totals[range], count: totals[range] }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Task Status</h1>
        <p className="text-muted-foreground">
          View job counts by time and budget — from database or saved CSV
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">View options</CardTitle>
          <CardDescription>Data source and period</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Data from</label>
            <Select value={dataSource} onValueChange={(v: "db" | "file") => setDataSource(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dataSource === "file" && (
              <p className="text-xs text-muted-foreground">Only single day uses saved CSV</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period === "single_day" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              />
            </div>
          )}
          {period === "custom" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
              </div>
            </>
          )}
          {period === "single_day" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={downloading || !canDownloadCSV}
              className="gap-2 mt-7"
            >
              <Download className="h-4 w-4" />
              {downloading ? "..." : "Download CSV"}
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalJobs}</div>
                <p className="text-xs text-muted-foreground">{data.date}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Slots Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chartByTime.length}</div>
                <p className="text-xs text-muted-foreground">30-min intervals with jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Ranges</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chartByBudget.length}</div>
                <p className="text-xs text-muted-foreground">Ranges with at least one job</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Time</CardTitle>
                <CardDescription>Number of jobs per 30-minute interval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {chartByTime.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No jobs in this date
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartByTime}
                        margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => {
                            const m = v.match(/(\d+):(\d+)/);
                            return m ? `${m[1]}:${m[2]}` : v;
                          }}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.full ?? ""
                          }
                          formatter={(value: number) => [`${value} jobs`, "Jobs"]}
                        />
                        <Bar
                          dataKey="jobs"
                          fill="hsl(var(--chart-1))"
                          name="Jobs"
                          radius={[4, 4, 0, 0]}
                          onClick={(entry: any) => {
                            const time = entry?.payload?.time as string | undefined;
                            if (time) fetchClientsForFilter({ timeRange: time });
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jobs by Budget</CardTitle>
                <CardDescription>Distribution by project budget range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {chartByBudget.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No jobs in this date
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartByBudget}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          onClick={(entry: any) => {
                            const name = (entry && (entry.name as string | undefined)) || undefined;
                            if (name) fetchClientsForFilter({ budgetRange: name });
                          }}
                        >
                          {chartByBudget.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={BUDGET_COLORS[entry.name] ?? "hsl(var(--chart-1))"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          formatter={(value: number) => [`${value} jobs`, "Count"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {chartByTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Jobs Over Time (Line)</CardTitle>
                <CardDescription>Trend of job count across the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartByTime}
                      margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                      onClick={(state: any) => {
                        const label = state?.activeLabel as string | undefined;
                        if (label) fetchClientsForFilter({ timeRange: label });
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => {
                          const m = v.match(/(\d+):(\d+)/);
                          return m ? `${m[1]}:${m[2]}` : v;
                        }}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.full ?? ""
                        }
                        formatter={(value: number) => [`${value} jobs`, "Jobs"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="jobs"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Jobs"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {chartByBudget.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amount by Budget (Bar)</CardTitle>
                <CardDescription>Job count per budget range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartByBudget}
                      layout="vertical"
                      margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={76}
                        tick={{ fontSize: 9 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number) => [`${value} jobs`, "Count"]}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-2))"
                        name="Jobs"
                        radius={[0, 4, 4, 0]}
                        onClick={(entry: any) => {
                          const name = entry?.payload?.name as string | undefined;
                          if (name) fetchClientsForFilter({ budgetRange: name });
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!loading && !data && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
            <p>Select a date to view task status</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clients for selected segment</DialogTitle>
            <DialogDescription>
              {clientFilter?.timeRange && <span>Time: {clientFilter.timeRange} </span>}
              {clientFilter?.budgetRange && <span>Budget: {clientFilter.budgetRange}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 max-h-[420px] space-y-3 overflow-y-auto">
            {clientLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clients found for this segment.</p>
            ) : (
              clientList.map((client) => (
                <div
                  key={client.clientId}
                  className="rounded-md border px-3 py-2 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {client.clientAvatar && (
                        <img
                          src={`https://crowdworks.jp/${client.clientAvatar}`}
                          alt={client.clientName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">
                        {client.clientName || "Unknown client"} (ID:{" "}
                        {client.clientId || "N/A"})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {client.jobCount} job{client.jobCount > 1 ? "s" : ""}
                      </span>
                      <a
                        href={`${CW_CLIENT_URL}${client.clientId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Client link
                      </a>
                    </div>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {client.jobs.slice(0, 5).map((job) => (
                      <li key={job.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[55%]">{job.title}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>
                            {job.budgetRange} / {job.jobType}
                          </span>
                          <a
                            href={`${CW_JOB_URL}${job.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            Job link
                          </a>
                        </div>
                      </li>
                    ))}
                    {client.jobs.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{client.jobs.length - 5} more…
                      </li>
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
