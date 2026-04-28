import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isAllowed } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAllowed) {
        setLocation("/access-denied");
      }
    }
  }, [isLoading, isAllowed, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return null; // Will redirect to access-denied
  }

  return <>{children}</>;
}
