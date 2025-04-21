import { Scenario, ScenarioRun } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { InfoIcon, PlayIcon } from "lucide-react";
import { Link } from "wouter";
import { useRunScenario } from "@/hooks/useScenario";

interface ScenarioCardProps {
  scenario: Scenario;
  lastRun?: ScenarioRun;
  onRunComplete?: (runId: number) => void;
}

export function ScenarioCard({ scenario, lastRun, onRunComplete }: ScenarioCardProps) {
  const runMutation = useRunScenario();
  
  const handleRunScenario = async () => {
    try {
      const result = await runMutation.mutateAsync(scenario.id);
      if (onRunComplete && result.runId) {
        onRunComplete(result.runId);
      }
    } catch (error) {
      console.error("Failed to run scenario:", error);
    }
  };
  
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        );
    }
  };
  
  return (
    <Card className="bg-gray-800 border border-gray-700 hover:shadow-lg transition duration-200 h-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white mb-2">{scenario.name}</h3>
          {lastRun && getStatusBadge(lastRun.status)}
        </div>
        
        <p className="text-gray-400 text-sm mb-4">{scenario.description}</p>
        
        <div className="mb-4">
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Target Applications</h4>
          <div className="flex flex-wrap gap-2">
            {scenario.targetApps.map((app) => (
              <Badge key={app} variant="secondary" className="bg-blue-900 text-blue-300 border-blue-800">
                {app}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Last Run</h4>
          <p className="text-sm text-gray-300">
            {lastRun ? formatRelativeTime(lastRun.startTime) : "Never"}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-900 border-t border-gray-700 px-6 py-3 gap-2 justify-between">
        <Link href={`/scenarios/${scenario.id}`}>
          <Button variant="outline" size="sm" className="text-gray-300 border-gray-700 hover:bg-gray-800">
            <InfoIcon className="h-4 w-4 mr-1.5" />
            Details
          </Button>
        </Link>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={handleRunScenario}
          disabled={runMutation.isPending}
        >
          <PlayIcon className="h-4 w-4 mr-1.5" />
          Run Now
        </Button>
      </CardFooter>
    </Card>
  );
}
