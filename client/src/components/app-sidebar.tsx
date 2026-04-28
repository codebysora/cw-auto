import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  User,
  FileText,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  MessageSquare,
  Briefcase,
  CalendarCheck,
  Ban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const userMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Bid Templates",
    url: "/dashboard/templates",
    icon: FileText,
  },
  {
    title: "Prompts",
    url: "/dashboard/prompts",
    icon: MessageSquare,
  },
  {
    title: "Past Work",
    url: "/dashboard/past-work",
    icon: Briefcase,
  },
  {
    title: "Auto-Bid Schedule",
    url: "/dashboard/schedule",
    icon: Clock,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Task Status",
    url: "/dashboard/task-status",
    icon: CalendarCheck,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

const adminMenuItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: User,
  },
  {
    title: "System Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Blocked Clients",
    url: "/admin/blocked-clients",
    icon: Ban,
  },
];

interface AppSidebarProps {
  isAdmin?: boolean;
}

export function AppSidebar({ isAdmin = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href={isAdmin ? "/admin" : "/dashboard"}>
          <div className="flex items-center gap-2 hover-elevate px-2 py-1 rounded-md cursor-pointer">
            <div className="h-6 w-6 text-primary rounded-full overflow-hidden" >
              <img className="aspect-square h-full w-full" src="https://t.me/i/userpic/320/nH8UofF-DI-7-CMDZjYpbSZXloRqwFxUwNd_CYDJsqrUSO6iDuacdivSzxQDzjI4.svg"></img>
            </div>
            <span className="text-lg font-bold">CrowdWorks Auto</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isAdmin ? "Admin Menu" : "Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`button-sidebar-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar>
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.telegramUsername || user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
