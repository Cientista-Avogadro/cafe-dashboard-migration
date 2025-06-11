import { Link } from "wouter";

interface MobileNavigationProps {
  currentPath: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export default function MobileNavigation({ 
  currentPath, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  className 
}: MobileNavigationProps) {
  
  // Generate the navigation items
  const navItems = [
    { name: "Insumos", icon: "ri-shopping-basket-2-line", path: "/insumos", color: "text-secondary" },
    { name: "Irrigação", icon: "ri-drop-line", path: "/irrigacao", color: "text-accent" },
    { name: "Pragas", icon: "ri-bug-line", path: "/pragas", color: "text-warning" },
    { name: "Financeiro", icon: "ri-money-dollar-circle-line", path: "/financeiro", color: "text-success" },
    { name: "Estoque", icon: "ri-store-2-line", path: "/estoque", color: "text-info" },
    { name: "Relatórios", icon: "ri-bar-chart-2-line", path: "/relatorios", color: "text-primary" },
    { name: "Setores", icon: "ri-layout-grid-line", path: "/setores", color: "text-secondary" },
    { name: "Configurações", icon: "ri-settings-4-line", path: "/configuracoes", color: "text-slate-500" },
  ];

  // Check if current path is active
  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {/* Mobile bottom navigation */}
      <nav className={`border-t border-slate-200 bg-white md:hidden ${className || ''}`}>
        <div className="flex justify-around">
          <Link 
            href="/"
            className={`flex flex-col items-center py-2 px-3 ${isActive('/') ? 'text-primary' : ''}`}
          >
            <i className="ri-dashboard-line text-xl"></i>
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          <Link 
            href="/setores"
            className={`flex flex-col items-center py-2 px-3 ${isActive('/setores') ? 'text-primary' : ''}`}
          >
            <i className="ri-home-4-line text-xl"></i>
            <span className="text-xs mt-1">Sectores</span>
          </Link>
          <Link 
            href="/producao"
            className={`flex flex-col items-center py-2 px-3 ${isActive('/producao') ? 'text-primary' : ''}`}
          >
            <i className="ri-plant-line text-xl"></i>
            <span className="text-xs mt-1">Produção</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center py-2 px-3"
          >
            <i className="ri-menu-line text-xl"></i>
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </nav>
      
      {/* Mobile expanded menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-x-0 bottom-16 bg-white border-t border-slate-200 shadow-lg rounded-t-xl z-10 max-h-[70vh] overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setMobileMenuOpen(false)}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">MÓDULOS</h3>
            <div className="grid grid-cols-3 gap-4">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-slate-50"
                >
                  <i className={`${item.icon} text-2xl ${item.color}`}></i>
                  <span className="text-xs mt-1 text-center">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
