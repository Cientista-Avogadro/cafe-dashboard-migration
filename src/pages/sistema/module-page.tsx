import { Card } from "@/components/ui/card";

interface ModulePageProps {
  title: string;
  icon: string;
}

export default function ModulePage({ title, icon }: ModulePageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-slate-500">Gerencie {title.toLowerCase()}</p>
      </div>

      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl text-primary/20 mb-4">
            <i className={icon}></i>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Módulo em Desenvolvimento</h2>
          <p className="text-slate-500">
            A interface para este módulo está sendo implementada e estará disponível em breve.
          </p>
        </Card>
      </div>
    </div>
  );
}
