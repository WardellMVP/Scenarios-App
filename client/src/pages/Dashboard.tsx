import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatusSummary } from "@/components/dashboard/StatusSummary";
import { ScenarioGrid } from "@/components/scenario/ScenarioGrid";
import { ScenarioConsole } from "@/components/scenario/ScenarioConsole";
import { useScenario } from "@/hooks/useScenario";

export default function Dashboard() {
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  
  const { data: activeScenario } = useScenario(activeScenarioId || 0);
  
  const handleScenarioRun = (runId: number, scenarioId?: number) => {
    setActiveRunId(runId);
    if (scenarioId) {
      setActiveScenarioId(scenarioId);
    }
  };
  
  const closeConsole = () => {
    setActiveRunId(null);
    setActiveScenarioId(null);
  };
  
  return (
    <div className="p-6">
      <Header title="Dashboard" showSync />
      
      <StatusSummary />
      
      {activeRunId && (
        <ScenarioConsole 
          runId={activeRunId} 
          scenario={activeScenario}
          onClose={closeConsole}
        />
      )}
      
      <ScenarioGrid onScenarioRun={handleScenarioRun} />
    </div>
  );
}
