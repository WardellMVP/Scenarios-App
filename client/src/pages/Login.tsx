import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { CircuitBoard } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <CircuitBoard className="h-12 w-12 text-primary-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">CyberSim</CardTitle>
          <CardDescription className="text-gray-400">
            Cybersecurity Threat Simulator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-sm text-gray-400">
              Log in with your GitLab account to access the simulator
            </p>
          </div>
          
          <Button 
            className="w-full"
            onClick={login}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 50 50" fill="currentColor">
              <path d="M 25 2 C 12.318 2 2 12.317 2 25 C 2 37.683 12.318 48 25 48 C 37.682 48 48 37.683 48 25 C 48 12.317 37.682 2 25 2 z M 16.646484 13.832031 L 21.919922 13.832031 L 25.134766 22.824219 L 28.361328 13.832031 L 33.630859 13.832031 L 25 36.167969 L 16.646484 13.832031 z"/>
            </svg>
            Sign in with GitLab
          </Button>
          
          <p className="text-xs text-center text-gray-400 mt-4">
            Your GitLab credentials are securely handled by GitLab's OAuth service.
            This application only receives authorization tokens.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
