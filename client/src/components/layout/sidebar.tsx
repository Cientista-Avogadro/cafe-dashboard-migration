import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentPath: string;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, currentPath }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  
  // Check if current path is active
  const isActive = (path: string) => currentPath === path;

  // Generate the navigation items for both desktop and mobile
  const navItems = [
    { name: "Dashboard", icon: "ri-dashboard-line", path: "/" },
    { name: "Fazendas", icon: "ri-home-4-line", path: "/fazendas" },
    { name: "Setores e Lotes", icon: "ri-layout-grid-line", path: "/setores" },
    { name: "Produção", icon: "ri-plant-line", path: "/producao" },
    { name: "Insumos", icon: "ri-shopping-basket-2-line", path: "/insumos" },
    { name: "Irrigação", icon: "ri-drop-line", path: "/irrigacao" },
    { name: "Pragas", icon: "ri-bug-line", path: "/pragas" },
    { name: "Financeiro", icon: "ri-money-dollar-circle-line", path: "/financeiro" },
    { name: "Estoque", icon: "ri-store-2-line", path: "/estoque" },
    { name: "Relatórios", icon: "ri-bar-chart-2-line", path: "/relatorios" },
    { name: "Configurações", icon: "ri-settings-4-line", path: "/configuracoes" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <span className="text-2xl font-bold text-primary">AgroGestão</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ${
                    isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <i className={`${item.icon} mr-3 h-5 w-5`}></i>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="text-sm font-medium">{user?.username?.substring(0, 2).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-700">{user?.username}</p>
                  <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                    {user?.role || "Usuário"}
                  </p>
                </div>
                <button 
                  onClick={() => logoutMutation.mutate()}
                  className="ml-auto text-slate-500 hover:text-slate-700"
                >
                  <i className="ri-logout-box-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog">
        <div 
          className="fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity ease-linear duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        <div className="fixed inset-0 z-40 flex">
          <div className="relative flex flex-1 flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <i className="ri-close-line text-white text-2xl"></i>
              </button>
            </div>
            
            <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <span className="text-xl font-bold text-primary">AgroGestão</span>
              </div>
              <nav className="mt-5 space-y-1 px-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ${
                      isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <i className={`${item.icon} mr-3 h-5 w-5`}></i>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">
                      <span className="text-sm font-medium">{user?.username?.substring(0, 2).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-700">{user?.username}</p>
                    <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                      {user?.role || "Usuário"}
                    </p>
                  </div>
                  <button 
                    onClick={() => logoutMutation.mutate()}
                    className="ml-auto text-slate-500 hover:text-slate-700"
                  >
                    <i className="ri-logout-box-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
