import { useState } from 'react';
import type { PublicUser } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { usePropertyData } from '@/hooks/use-hasura-query';
import { Propriedade } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/queryClient';

interface HeaderProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: PublicUser;
  className?: string;
}

export default function Header({ setSidebarOpen, user, className }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { logoutMutation } = useAuth();

  // Buscar informações da propriedade atual
  const { data } = useQuery<Propriedade | null>({
    queryKey: ["propriedade", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return null;
      
      const result = await graphqlRequest(
        "GET_PROPRIEDADES",
        { user_id: user.propriedade_id }
      );
      
      return result.propriedades && result.propriedades.length > 0 ? result.propriedades[0] : null;
    },
    enabled: !!user?.propriedade_id,
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className={`bg-white shadow-sm md:hidden ${className || ''}`}>
      <div className="py-3 px-4 flex justify-between items-center">
        <button 
          onClick={() => setSidebarOpen(true)} 
          type="button" 
          className="text-slate-500 hover:text-slate-600"
        >
          <i className="ri-menu-line text-xl"></i>
        </button>
        <span className="text-lg font-bold text-primary">AgroGestão</span>
        <button 
          onClick={() => setProfileOpen(!profileOpen)} 
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white"
        >
          <span className="text-sm font-medium">
            {(user?.nome || user?.email || '').substring(0, 2).toUpperCase()}
          </span>
        </button>
      </div>
      
      {profileOpen && (
        <div 
          className="absolute right-2 top-12 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          onClick={(e) => e.currentTarget === e.target && setProfileOpen(false)}
        >
          <div className="py-1">
            <Link 
              href="/sistema/usuarios" 
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => setProfileOpen(false)}
            >
              Meu Perfil
            </Link>
            <Link 
              href="/sistema/configuracao" 
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => setProfileOpen(false)}
            >
              Configurações
            </Link>
            <button 
              onClick={handleLogout} 
              className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
