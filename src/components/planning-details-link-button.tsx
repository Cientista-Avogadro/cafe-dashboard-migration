import { Button } from "@/components/ui/button";

interface PlanningDetailsLinkButtonProps {
  planejamentoId: string;
}

/**
 * Botão para acessar a página de detalhes do planejamento
 * Este componente pode ser adicionado facilmente à interface existente
 */
export function PlanningDetailsLinkButton({ planejamentoId }: PlanningDetailsLinkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita propagação do evento para elementos pai
    window.location.href = `/producao/${planejamentoId}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="ml-2"
    >
      Ver Detalhes
    </Button>
  );
}
