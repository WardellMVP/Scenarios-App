import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    onSuccess: (data) => {
      setIsAuthenticated(true);
    },
    onError: () => {
      setIsAuthenticated(false);
    },
    retry: false,
  });

  const login = () => {
    // Redirect to the login URL
    window.location.href = "/api/auth/login";
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
