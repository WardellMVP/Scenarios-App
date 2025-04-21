import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSyncScenarios } from "@/hooks/useScenario";
import { RefreshCw } from "lucide-react";

interface HeaderProps {
  title: string;
  showSync?: boolean;
}

export function Header({ title, showSync = false }: HeaderProps) {
  const { logout } = useAuth();
  const syncMutation = useSyncScenarios();
  
  const handleSync = () => {
    syncMutation.mutate();
  };
  
  return (
    <div className="flex justify-between items-center pb-6">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      
      <div className="flex items-center space-x-4">
        {showSync && (
          <Button 
            variant="default"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Scenarios
          </Button>
        )}
        
        <Button 
          variant="outline"
          onClick={() => logout()}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
