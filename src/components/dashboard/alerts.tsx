import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeverityColor } from "@/lib/utils";

interface AlertsProps {
  alerts?: Alert[];
  isLoading: boolean;
}

export default function Alerts({ alerts, isLoading }: AlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Alertas Recentes</h2>
        <div className="space-y-3">
          {alerts?.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex-shrink-0">
                <i className={`${alert.icon} text-lg`}></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">{alert.message}</p>
                <p className="text-xs text-slate-500">{alert.location}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
