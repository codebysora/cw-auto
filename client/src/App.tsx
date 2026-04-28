import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AuthGuard } from "@/components/auth-guard";

// Lazy load pages for better code splitting
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/dashboard/profile"));
const Templates = lazy(() => import("@/pages/dashboard/templates"));
const Prompts = lazy(() => import("@/pages/dashboard/prompts"));
const PastWork = lazy(() => import("@/pages/dashboard/past-work"));
const Schedule = lazy(() => import("@/pages/dashboard/schedule"));
const Analytics = lazy(() => import("@/pages/dashboard/analytics"));
const TaskStatus = lazy(() => import("@/pages/dashboard/task-status"));
const Settings = lazy(() => import("@/pages/dashboard/settings"));
const AdminDashboard = lazy(() => import("@/pages/admin"));
const UserManagement = lazy(() => import("@/pages/admin/users"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const BlockedClients = lazy(() => import("@/pages/admin/blocked-clients"));
const AccessDenied = lazy(() => import("@/pages/access-denied"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Access Denied Route */}
        <Route path="/access-denied" component={AccessDenied} />

        {/* Protected Routes - All require authentication */}
        <Route path="/">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/profile">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/templates">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Templates />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/prompts">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Prompts />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/past-work">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <PastWork />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/schedule">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Schedule />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/analytics">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/task-status">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <TaskStatus />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/dashboard/settings">
          {() => (
            <AuthGuard>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          {() => (
            <AuthGuard>
              <DashboardLayout isAdmin>
                <AdminDashboard />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/admin/users">
          {() => (
            <AuthGuard>
              <DashboardLayout isAdmin>
                <UserManagement />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/admin/analytics">
          {() => (
            <AuthGuard>
              <DashboardLayout isAdmin>
                <AdminAnalytics />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>
        <Route path="/admin/blocked-clients">
          {() => (
            <AuthGuard>
              <DashboardLayout isAdmin>
                <BlockedClients />
              </DashboardLayout>
            </AuthGuard>
          )}
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { AuthProvider } from "@/lib/auth";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
