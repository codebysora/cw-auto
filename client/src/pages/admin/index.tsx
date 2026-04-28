import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
} from "lucide-react";
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

const adminStats = [
  {
    title: "Total Users",
    value: "284",
    change: "+18",
    trend: "up",
    icon: Users,
  },
  {
    title: "Active Users",
    value: "245",
    change: "+12",
    trend: "up",
    icon: UserCheck,
  },
  {
    title: "Pending Approval",
    value: "23",
    change: "+5",
    trend: "up",
    icon: Clock,
  },
  {
    title: "Blocked Users",
    value: "16",
    change: "+3",
    trend: "up",
    icon: UserX,
  },
];

const systemActivityData = [
  { date: "Mon", users: 245, bids: 1840, messages: 520 },
  { date: "Tue", users: 252, bids: 1920, messages: 580 },
  { date: "Wed", users: 248, bids: 1780, messages: 510 },
  { date: "Thu", users: 260, bids: 2100, messages: 640 },
  { date: "Fri", users: 255, bids: 1950, messages: 590 },
  { date: "Sat", users: 238, bids: 1560, messages: 420 },
  { date: "Sun", users: 242, bids: 1680, messages: 480 },
];

const topPerformers = [
  { name: "John Doe", bids: 156, success: 52, rate: "33.3%" },
  { name: "Jane Smith", bids: 142, success: 48, rate: "33.8%" },
  { name: "Mike Johnson", bids: 138, success: 45, rate: "32.6%" },
  { name: "Sarah Williams", bids: 128, success: 42, rate: "32.8%" },
  { name: "Tom Brown", bids: 124, success: 38, rate: "30.6%" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system performance and user activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{stat.change}</span>
                <span className="text-muted-foreground">this week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Activity (Last 7 Days)</CardTitle>
            <CardDescription>Active users and bidding activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={systemActivityData}>
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
                    dataKey="users"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Active Users"
                  />
                  <Line
                    type="monotone"
                    dataKey="bids"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Total Bids"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Bids vs messages comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemActivityData}>
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
                  <Bar dataKey="bids" fill="hsl(var(--chart-2))" name="Bids" />
                  <Bar dataKey="messages" fill="hsl(var(--chart-3))" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Users</CardTitle>
          <CardDescription>Users with the highest success rates this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Total Bids</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Successful</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((user, index) => (
                  <tr key={index} className="border-b hover-elevate">
                    <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-sm">{user.bids}</td>
                    <td className="py-3 px-4 text-sm">{user.success}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{user.rate}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>New users pending approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">User {i}</p>
                    <p className="text-xs text-muted-foreground">Registered {i}h ago</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">API Status</p>
                  <p className="text-xs text-muted-foreground">All services operational</p>
                </div>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Database</p>
                  <p className="text-xs text-muted-foreground">Connection healthy</p>
                </div>
                <Badge variant="default" className="bg-green-500">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Auto-Bidding</p>
                  <p className="text-xs text-muted-foreground">245 active schedules</p>
                </div>
                <Badge variant="default" className="bg-green-500">Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
