import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentPath: string;
}

interface NavItem {
  name: string;
  icon: string;
  path: string;
  submenu?: NavItem[];
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, currentPath }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  
  // Check if current path is active
  const isActive = (path: string) => currentPath === path;

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Principal": true, // Principal is expanded by default
    "Área de Plantio": false,
    "Operações": false,
    "Recursos": false,
    "Gestão": false,
    "Sistema": false
  });

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Define categories for navigation items
  const navCategories: Array<{name: string, items: NavItem[]}> = [
    {
      name: "Principal",
      items: [
        { name: "Dashboard", icon: "ri-dashboard-line", path: "/" }
      ]
    },
    {
      name: "Área de Plantio",
      items: [
        { name: "Culturas", icon: "ri-seedling-line", path: "/culturas" },
        { name: "Setores", icon: "ri-layout-grid-line", path: "/setores" },
        { name: "Lotes", icon: "ri-home-line", path: "/lotes" },
        { name: "Canteiros", icon: "ri-layout-3-line", path: "/canteiros" }
      ]
    },
    {
      name: "Operações",
      items: [
        { name: "Produção", icon: "ri-plant-line", path: "/producao" },
        { name: "Irrigação", icon: "ri-drop-line", path: "/irrigacao" },
        { name: "Pragas", icon: "ri-bug-line", path: "/pragas" }
      ]
    },
    {
      name: "Recursos",
      items: [
        { name: "Insumos", icon: "ri-shopping-basket-2-line", path: "/insumos" },
        { name: "Estoque", icon: "ri-store-2-line", path: "/estoque" }
      ]
    },
    {
      name: "Gestão",
      items: [
        { name: "Financeiro", icon: "ri-money-dollar-circle-line", path: "/financeiro" },
        { name: "Relatórios", icon: "ri-bar-chart-2-line", path: "/relatorios" }
      ]
    },
    {
      name: "Sistema",
      items: [
        { name: "Configurações", icon: "ri-settings-4-line", path: "/sistema/configuracao" },
        { name: "Usuários", icon: "ri-user-settings-line", path: "/sistema/usuarios" }
      ]
    }
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
            <nav className="mt-5 flex-1 space-y-2 px-2">
              {navCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-1">
                  <button 
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md group transition-all duration-200 ease-in-out"
                  >
                    <div className="flex items-center">
                      <i className={`ri-folder-${expandedCategories[category.name] ? 'open-' : ''}line mr-2 text-slate-500 group-hover:text-primary`}></i>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <i className={`ri-arrow-${expandedCategories[category.name] ? 'down' : 'right'}-s-line transition-transform duration-200`}></i>
                  </button>
                  
                  <div className={`space-y-1 overflow-hidden transition-all duration-200 ${expandedCategories[category.name] ? 'max-h-96' : 'max-h-0'}`}>
                    {category.items.map((item) => (
                      <div key={item.path}>
                        <Link 
                          href={item.path}
                          className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ml-4 ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}
                        >
                          <div className="flex items-center">
                            <i className={`${item.icon} mr-3 h-5 w-5`}></i>
                            {item.name}
                          </div>
                          {item.submenu && item.submenu.length > 0 && (
                            <i className="ri-arrow-right-s-line text-slate-400"></i>
                          )}
                        </Link>
                        
                        {/* Render submenu if exists */}
                        {item.submenu && item.submenu.length > 0 && (
                          <div className="ml-8 space-y-1 mt-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.path}
                                href={subItem.path}
                                className={`group flex items-center px-2 py-2 text-xs font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ${isActive(subItem.path) ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}
                              >
                                <i className={`${subItem.icon} mr-2 h-4 w-4`}></i>
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="text-sm font-medium">{((user?.nome || user?.email || "").substring(0, 2)).toUpperCase()}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-700">{user?.nome || user?.email}</p>
                  <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                    {user?.role || "Usuário"}
                  </p>
                </div>
                <button 
                  onClick={() => logoutMutation.mutate()}
                  className="ml-auto text-slate-500 hover:text-slate-700"
                  aria-label="Sair da conta"
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
                aria-label="Fechar menu lateral"
              >
                <i className="ri-close-line text-white text-2xl"></i>
              </button>
            </div>
            
            <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <span className="text-xl font-bold text-primary">AgroGestão</span>
              </div>
              <nav className="mt-5 space-y-2 px-2">
                {navCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-1">
                    <button 
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md group transition-all duration-200 ease-in-out"
                    >
                      <div className="flex items-center">
                        <i className={`ri-folder-${expandedCategories[category.name] ? 'open-' : ''}line mr-2 text-slate-500 group-hover:text-primary`}></i>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <i className={`ri-arrow-${expandedCategories[category.name] ? 'down' : 'right'}-s-line transition-transform duration-200`}></i>
                    </button>
                    
                    <div className={`space-y-1 overflow-hidden transition-all duration-200 ${expandedCategories[category.name] ? 'max-h-96' : 'max-h-0'}`}>
                      {category.items.map((item) => (
                        <div key={item.path}>
                          <Link 
                            href={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ml-4 ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}
                          >
                            <div className="flex items-center">
                              <i className={`${item.icon} mr-3 h-5 w-5`}></i>
                              {item.name}
                            </div>
                            {item.submenu && item.submenu.length > 0 && (
                              <i className="ri-arrow-right-s-line text-slate-400"></i>
                            )}
                          </Link>
                          
                          {/* Render submenu if exists */}
                          {item.submenu && item.submenu.length > 0 && (
                            <div className="ml-8 space-y-1 mt-1">
                              {item.submenu.map((subItem) => (
                                <Link
                                  key={subItem.path}
                                  href={subItem.path}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`group flex items-center px-2 py-2 text-xs font-medium rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer ${isActive(subItem.path) ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}
                                >
                                  <i className={`${subItem.icon} mr-2 h-4 w-4`}></i>
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
            
            <div className="flex flex-shrink-0 border-t border-slate-200 p-4">
              <div className="group block w-full flex-shrink-0">
                <div className="flex items-center">
                  <div>
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white">
                      <span className="text-sm font-medium">{((user?.nome || user?.email || "").substring(0, 2)).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-700">{user?.nome || user?.email}</p>
                    <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                      {user?.role || "Usuário"}
                    </p>
                  </div>
                  <button 
                    onClick={() => logoutMutation.mutate()}
                    className="ml-auto text-slate-500 hover:text-slate-700"
                    aria-label="Sair da conta"
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
