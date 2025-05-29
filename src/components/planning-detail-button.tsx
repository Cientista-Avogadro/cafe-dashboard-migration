import { Button } from "@/components/ui/button";

interface PlanningDetailButtonProps {
  planejamentoId: string;
}

export function PlanningDetailButton({ planejamentoId }: PlanningDetailButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/producao/${planejamentoId}`;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      title="Ver detalhes do custo de produção"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <path d="M14 2v6h6"></path>
        <path d="M16 13H8"></path>
        <path d="M16 17H8"></path>
        <path d="M10 9H8"></path>
      </svg>
    </Button>
  );
}
