import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { TrendingUp, TrendingDown, FileText, MessageSquare, Phone, Target, Calendar, Download, } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { useAuth } from "@/lib/auth";

const timeRanges = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all_time" },
  { label: "Custom", value: "custom" },
];

const weeklyData = [
  { date: "Jan 1", bids: 120, messages: 0, contacts: 0, jobs: 0 },
  { date: "Jan 8", bids: 145, messages: 0, contacts: 0, jobs: 0 },
  { date: "Jan 15", bids: 132, messages: 0, contacts: 0, jobs: 0 },
  { date: "Jan 22", bids: 156, messages: 0, contacts: 0, jobs: 0 },
  { date: "Jan 29", bids: 168, messages: 0, contacts: 0, jobs: 0 },
  { date: "Feb 5", bids: 142, messages: 0, contacts: 0, jobs: 0 },
  { date: "Feb 12", bids: 178, messages: 0, contacts: 0, jobs: 0 },
];

// const fixedBudgetDistribution = [
//   { name: "Low ($100-$500)", value: 25, color: "hsl(var(--chart-1))" },
//   { name: "Medium ($500-$2000)", value: 45, color: "hsl(var(--chart-2))" },
//   { name: "High ($2000+)", value: 30, color: "hsl(var(--chart-3))" },
// ];

// const hourlyBudgetDistribution = [
//   { name: "Low ($100-$500)", value: 25, color: "hsl(var(--chart-1))" },
//   { name: "Medium ($500-$2000)", value: 45, color: "hsl(var(--chart-2))" },
//   { name: "High ($2000+)", value: 30, color: "hsl(var(--chart-3))" },
// ];

// const rolePerformance = [
//   { role: "Web Development", bids: 450, success: 145 },
//   { role: "App Development", bids: 320, success: 98 },
//   { role: "AI Development", bids: 180, success: 72 },
//   { role: "E-Commerce", bids: 250, success: 85 },
//   { role: "Landing Page", bids: 140, success: 56 },
// ];

export default function Analytics() {

  const [timeRange, setTimeRange] = useState(timeRanges[2].value);
  const { telegramUser } = useAuth();
  const [fixedBudgetDistribution, setFixedBudgetDistribution] = useState<any>([]);
  const [hourlyBudgetDistribution, setHourlyBudgetDistribution] = useState<any>([]);
  const [weeklyData, setWeeklyData] = useState<any>([]);
  const [messages, setMessages] = useState<any>(0);
  const [contacts, setContacts] = useState<any>(0);
  const [successRate, setSuccessRate] = useState<any>(0);
  const [rolePerformance, setRolePerformance] = useState<any>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await apiClient.get("/api/analytics", { telegramId: telegramUser.id });
      const data = response.data;
      setFixedBudgetDistribution(data.fixedBudgetDistribution);
      setHourlyBudgetDistribution(data.hourlyBudgetDistribution);
      setRolePerformance(data.rolePerformance);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Analytics</h1>
          <p className="text-muted-foreground">
            Track your performance and optimize your bidding strategy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" data-testid="select-time-range">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((timeRange: any) => (
                <SelectItem key={timeRange.value} value={timeRange.value}>
                  {timeRange.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-metric-bids">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+15.2%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-messages">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Null</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.8%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-contacts">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Null</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-3.2%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-success">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Null%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5.1%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Bids, messages, contacts and jobs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
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
                  <Line
                    type="monotone"
                    dataKey="bids"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Bids"
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Messages"
                  />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Contacts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Circle Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution ( Fixed Price Jobs )</CardTitle>
            <CardDescription>Breakdown by budget range for fixed price jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fixedBudgetDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fixedBudgetDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Distribution ( Hourly Jobs )</CardTitle>
            <CardDescription>Breakdown by budget range for hourly jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hourlyBudgetDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {hourlyBudgetDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Role</CardTitle>
          <CardDescription>Success rate across different job categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rolePerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="role" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="bids" fill="hsl(var(--chart-1))" name="Total Bids" />
                <Bar dataKey="success" fill="hsl(var(--chart-2))" name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Weekly performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium">Week</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Bids</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Messages</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Contacts</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Jobs Posted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((week: any, index: number) => (
                  <tr key={index} className="border-b hover-elevate">
                    <td className="py-3 px-4 text-sm">{week.date}</td>
                    <td className="py-3 px-4 text-sm font-medium">{week.bids}</td>
                    <td className="py-3 px-4 text-sm font-medium">{week.messages}</td>
                    <td className="py-3 px-4 text-sm font-medium">{week.contacts}</td>
                    <td className="py-3 px-4 text-sm font-medium">{week.jobs}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">
                        {((week.contacts / week.bids) * 100).toFixed(1)}%
                      </Badge>
                    </td>
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
