import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeverityColor } from "@/lib/utils";

interface RecentActivitiesProps {
  activities?: Activity[];
  isLoading: boolean;
}

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                  <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                </tr>
              </thead>
              <tbody>
                {Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Atividades Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Atividade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fazenda</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Responsável</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {activities?.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{activity.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{activity.activity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{activity.farm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{activity.responsible}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getSeverityColor(activity.status === "Concluído" ? "success" : activity.status === "Em andamento" ? "warning" : "info")}>{activity.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
