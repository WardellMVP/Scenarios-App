import { useState } from "react";
import { useScenarios } from "@/hooks/useScenario";
import { ScenarioCard } from "./ScenarioCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ScenarioGridProps {
  onScenarioRun?: (runId: number) => void;
}

export function ScenarioGrid({ onScenarioRun }: ScenarioGridProps) {
  const { data: scenarios, isLoading, error } = useScenarios();
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredScenarios = scenarios?.filter(scenario => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      scenario.name.toLowerCase().includes(term) ||
      (scenario.description && scenario.description.toLowerCase().includes(term)) ||
      scenario.targetApps.some(app => app.toLowerCase().includes(term))
    );
  });
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Available Scenarios</h2>
          <div className="relative w-64">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">Error Loading Scenarios</h2>
        <p className="text-gray-400">
          There was an error loading the scenarios. Please try again later.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Available Scenarios</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search scenarios"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredScenarios && filteredScenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map(scenario => (
            <ScenarioCard 
              key={scenario.id} 
              scenario={scenario}
              onRunComplete={onScenarioRun}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400">
            {searchTerm 
              ? "No scenarios match your search criteria."
              : "No scenarios available. Sync from GitLab to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
