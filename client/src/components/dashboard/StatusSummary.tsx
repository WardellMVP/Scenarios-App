import { useQuery } from "@tanstack/react-query";
import { Stats } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { AlertCircle, Clock, Package, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatusSummary() {
  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error || !stats) {
    return (
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to load statistics</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const statCards = [
    {
      title: "Total Scenarios",
      value: stats.totalScenarios,
      icon: <Package className="h-6 w-6 text-primary-500" />,
      bgColor: "bg-primary-500",
    },
    {
      title: "Successful Runs",
      value: stats.successfulRuns,
      icon: <ThumbsUp className="h-6 w-6 text-green-500" />,
      bgColor: "bg-green-500",
    },
    {
      title: "Failed Runs",
      value: stats.failedRuns,
      icon: <AlertCircle className="h-6 w-6 text-red-500" />,
      bgColor: "bg-red-500",
    },
    {
      title: "Last Run",
      value: formatRelativeTime(stats.lastRunTime),
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      bgColor: "bg-blue-500",
    },
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((card, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md ${card.bgColor} bg-opacity-20 p-3`}>
                {card.icon}
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-400">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
