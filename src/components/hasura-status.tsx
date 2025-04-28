import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { hasuraClient } from "@/lib/hasura";
import { gql } from "graphql-request";

export default function HasuraStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "checking">("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatus("checking");
        
        const query = gql`
          query HealthCheck {
            __schema {
              queryType {
                name
              }
            }
          }
        `;
        
        await hasuraClient.request(query);
        
        setStatus("online");
        setError(null);
      } catch (err) {
        setStatus("offline");
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLastChecked(new Date());
      }
    };

    // Verificar imediatamente ao montar o componente
    checkStatus();

    // Configurar verificação periódica (a cada 30 segundos)
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-amber-500";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 cursor-help">
            <div className={`h-2 w-2 rounded-full ${getStatusColor(status)}`}></div>
            <Badge variant="outline" className="text-xs">
              Hasura {status === "checking" ? "verificando..." : status}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">Status da API Hasura: {status}</p>
            {lastChecked && (
              <p className="text-slate-500">
                Última verificação: {lastChecked.toLocaleTimeString()}
              </p>
            )}
            {error && <p className="text-red-500 mt-1">Erro: {error}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}