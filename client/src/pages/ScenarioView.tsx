import { useState } from "react";
import { useParams } from "wouter";
import { useScenario, useScenarioRuns, useRunScenario } from "@/hooks/useScenario";
import { ScenarioDetail } from "@/components/scenario/ScenarioDetail";
import { ScenarioConsole } from "@/components/scenario/ScenarioConsole";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ScenarioView() {
  const { id } = useParams<{ id: string }>();
  const scenarioId = parseInt(id);
  
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  
  const { data: scenario, isLoading: isLoadingScenario } = useScenario(scenarioId);
  const { data: runs, isLoading: isLoadingRuns } = useScenarioRuns(scenarioId);
  const runMutation = useRunScenario();
  
  const handleRunScenario = async () => {
    if (!scenario) return;
    
    try {
      const result = await runMutation.mutateAsync(scenario.id);
      if (result && result.runId) {
        setActiveRunId(result.runId);
      }
    } catch (error) {
      console.error("Failed to run scenario:", error);
    }
  };
  
  if (isLoadingScenario) {
    return (
      <div className="p-6">
        <Header title="Scenario Details" showSync />
        <Card className="bg-gray-800 border-gray-700 shadow-lg mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!scenario) {
    return (
      <div className="p-6">
        <Header title="Scenario Not Found" showSync />
        <Card className="bg-gray-800 border-gray-700 shadow-lg mb-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Scenario Not Found</h2>
            <p className="text-gray-400 mb-4">
              The scenario you're looking for does not exist or has been removed.
            </p>
            <Button asChild>
              <a href="/">Return to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">{scenario.name}</h1>
        
        <Button
          onClick={handleRunScenario}
          disabled={runMutation.isPending}
        >
          <PlayIcon className="h-5 w-5 mr-2" />
          Run Scenario
        </Button>
      </div>
      
      {activeRunId && (
        <ScenarioConsole
          runId={activeRunId}
          scenario={scenario}
          onClose={() => setActiveRunId(null)}
        />
      )}
      
      <ScenarioDetail
        scenario={scenario}
        runs={runs}
      />
    </div>
  );
}
