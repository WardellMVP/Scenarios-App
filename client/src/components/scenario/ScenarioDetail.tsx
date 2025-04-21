import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Scenario, ScenarioRun } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";
import { Link } from "wouter";

interface ScenarioDetailProps {
  scenario: Scenario;
  runs?: ScenarioRun[];
}

export function ScenarioDetail({ scenario, runs }: ScenarioDetailProps) {
  // Format YAML configuration for display
  const yamlConfig = `name: "${scenario.name}"
description: "${scenario.description || ''}"
target_apps: [${scenario.targetApps.join(', ')}]
exec_command: "${scenario.execCommand}"`;
  
  // Compatibility matrix data (mocked for now but could come from API)
  const compatibilityData = [
    {
      application: scenario.targetApps[0] || "Generic",
      compatibility: "Compatible",
      version: "All versions",
      notes: "Full functionality",
    },
    ...(scenario.targetApps.slice(1).map(app => ({
      application: app,
      compatibility: "Compatible",
      version: "All versions",
      notes: "Full functionality",
    }))),
  ];
  
  return (
    <Card className="bg-gray-800 border-gray-700 shadow-lg mb-8">
      <CardHeader className="border-b border-gray-700 bg-gray-900 px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-600 bg-opacity-20 flex items-center justify-center">
            <span className="h-6 w-6 text-primary-500">
              {/* Placeholder for scenario icon */}
              📋
            </span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-white">{scenario.name}</h3>
            <p className="text-sm text-gray-400">{scenario.description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-4">
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Configuration</h4>
          <div className="bg-gray-900 rounded-md p-4 font-mono text-sm text-gray-300 overflow-x-auto">
            <pre>{yamlConfig}</pre>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Compatibility Matrix</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Application</TableHead>
                  <TableHead className="text-gray-400">Compatibility</TableHead>
                  <TableHead className="text-gray-400">Version</TableHead>
                  <TableHead className="text-gray-400">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compatibilityData.map((item, index) => (
                  <TableRow key={index} className="border-gray-700">
                    <TableCell className="font-medium text-gray-300">
                      {item.application}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {item.compatibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{item.version}</TableCell>
                    <TableCell className="text-gray-300">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {runs && runs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Run History</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id} className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">
                        {formatDate(run.startTime)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            run.status === "success" 
                              ? "bg-green-100 text-green-800 border-green-200"
                              : run.status === "failed"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : run.status === "running"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDuration(run.duration)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/runs/${run.id}`}>
                          <a className="text-primary-500 hover:text-primary-400 text-sm font-medium">
                            View Log
                          </a>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
