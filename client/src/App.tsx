import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ui/theme-provider";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ScenarioView from "@/pages/ScenarioView";
import Login from "@/pages/Login";
import { Sidebar } from "@/components/layout/Sidebar";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }
  
  return <Component />;
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="md:pl-64">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/scenarios/:id" component={() => <ProtectedRoute component={ScenarioView} />} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
