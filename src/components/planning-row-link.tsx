import React from 'react';

interface PlanningRowLinkProps {
  id: string;
  children: React.ReactNode;
}

/**
 * Componente que envolve uma linha da tabela e adiciona funcionalidade de clique
 * para navegar para a página de detalhes do planejamento
 */
export function PlanningRowLink({ id, children }: PlanningRowLinkProps) {
  const handleClick = () => {
    window.location.href = `/producao/${id}`;
  };

  return (
    <tr 
      onClick={handleClick} 
      className="cursor-pointer hover:bg-muted/50"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </tr>
  );
}
