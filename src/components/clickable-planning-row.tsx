import React from 'react';
import { TableRow } from "@/components/ui/table";

interface ClickablePlanningRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente TableRow personalizado que navega para a página de detalhes do planejamento ao ser clicado
 */
export function ClickablePlanningRow({ id, children, className = "" }: ClickablePlanningRowProps) {
  const handleRowClick = () => {
    window.location.href = `/producao/${id}`;
  };

  return (
    <TableRow 
      onClick={handleRowClick} 
      className={`cursor-pointer hover:bg-muted/50 ${className}`}
    >
      {children}
    </TableRow>
  );
}
