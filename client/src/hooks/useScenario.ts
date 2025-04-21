import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScenarioRun, Scenario } from "@/types";

export function useScenarios() {
  return useQuery<Scenario[]>({ 
    queryKey: ['/api/scenarios'],
  });
}

export function useScenario(id: number) {
  return useQuery<Scenario>({ 
    queryKey: ['/api/scenarios', id.toString()],
    enabled: !!id,
  });
}

export function useScenarioRuns(scenarioId: number) {
  return useQuery<ScenarioRun[]>({ 
    queryKey: ['/api/scenarios', scenarioId.toString(), 'runs'],
    enabled: !!scenarioId,
  });
}

export function useScenarioRun(runId: number) {
  return useQuery<ScenarioRun>({ 
    queryKey: ['/api/runs', runId.toString()],
    enabled: !!runId,
    refetchInterval: (data) => {
      // Poll more frequently while running
      if (data?.status === 'running') {
        return 2000; // 2 seconds
      }
      
      return false; // Stop polling when complete
    },
  });
}

export function useRunScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scenarioId: number) => {
      const response = await apiRequest('POST', `/api/scenarios/${scenarioId}/run`);
      return await response.json();
    },
    onSuccess: (data, scenarioId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios', scenarioId.toString(), 'runs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });
}

export function useSyncScenarios() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sync');
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });
}
