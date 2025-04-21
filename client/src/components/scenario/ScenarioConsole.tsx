import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useScenarioRun } from "@/hooks/useScenario";
import { parseConsoleOutput } from "@/lib/utils";
import { Scenario } from "@/types";

interface ScenarioConsoleProps {
  runId: number;
  scenario?: Scenario;
  onClose?: () => void;
}

export function ScenarioConsole({ runId, scenario, onClose }: ScenarioConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);
  const { data: run } = useScenarioRun(runId);
  const [output, setOutput] = useState<string>("");
  
  // Set up WebSocket
  const { isConnected, messages, subscribeToRun } = useWebSocket({
    onMessage: (message) => {
      setOutput(prev => prev + message);
    },
  });
  
  // Subscribe to the run
  useEffect(() => {
    if (isConnected && runId) {
      subscribeToRun(runId);
    }
  }, [isConnected, runId, subscribeToRun]);
  
  // Scroll to bottom when output changes
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);
  
  // Initialize with existing output
  useEffect(() => {
    if (run?.output && !output) {
      setOutput(run.output);
    }
  }, [run, output]);
  
  const handleExportLog = () => {
    if (!output) return;
    
    // Create a blob with the log content
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario_${runId}_log.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Parse the output for colorized display
  const parsedOutput = parseConsoleOutput(output);
  
  return (
    <Card className="bg-gray-800 border-gray-700 shadow-lg mb-8">
      <CardHeader className="border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-600 bg-opacity-20 flex items-center justify-center">
              <span className="h-6 w-6 text-primary-500">▶</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">{scenario?.name || "Scenario Execution"}</h3>
              <p className="text-sm text-gray-400">
                {run?.status === "running" 
                  ? "Running simulation..." 
                  : run?.status === "success"
                  ? "Simulation completed successfully"
                  : run?.status === "failed"
                  ? "Simulation failed"
                  : "Preparing simulation..."}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              variant="secondary"
              onClick={handleExportLog}
              disabled={!output}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export Log
            </Button>
            {onClose && (
              <Button 
                size="sm"
                variant="destructive"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-1.5" />
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        <div 
          ref={consoleRef}
          className="h-[400px] overflow-y-auto bg-gray-900 border border-gray-700 font-mono text-sm p-4 rounded-md"
        >
          {parsedOutput.length > 0 ? (
            parsedOutput.map((line, index) => (
              <div key={index} className={line.className}>
                {line.text}
              </div>
            ))
          ) : (
            <div className="text-gray-400 flex items-center justify-center h-full">
              {run?.status === "pending" 
                ? "Waiting for execution to start..." 
                : "Connecting to execution stream..."}
            </div>
          )}
          {run?.status === "running" && (
            <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse"></span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
