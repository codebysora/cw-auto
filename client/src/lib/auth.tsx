import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";
import { apiClient } from "./api";

interface AuthContextType {
  user: User | null;
  telegramUser: any;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAllowed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: telegramUser, isLoading: telegramLoading } = useTelegram();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const authenticateUser = async () => {
      if (telegramLoading) return;

      if (!telegramUser) {
        setIsLoading(false);
        return;
      }
      try {
        // Check if user is allowed by admin
        const response = await apiClient.post('/api/auth/telegram', {
          telegramId: telegramUser.id,
          telegramUsername: telegramUser.username,
          fullName: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          // telegramId: 7386934803,
          // telegramId: 8091793606,
        });

        if (response.user) {
          setUser(response.user);
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      } catch (error) {
        const e: any = error;
        console.error('Authentication failed:', {
          message: e?.message,
          status: e?.response?.status,
          responseData: e?.response?.data,
          requestUrl: e?.config?.url,
          requestBaseURL: e?.config?.baseURL,
        });
        setIsAllowed(false);
      } finally {
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [telegramUser, telegramLoading]);

  const login = (userData: User) => {
    setUser(userData);
    setIsAllowed(true);
  };

  const logout = () => {
    setUser(null);
    setIsAllowed(false);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      telegramUser,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user && isAllowed,
      isLoading,
      isAllowed
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
