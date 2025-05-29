import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SistemaIndex() {
  const [, setLocation] = useLocation();
  
  // Redirecionar para a página de configurações por padrão
  useEffect(() => {
    setLocation("/sistema/config-page");
  }, [setLocation]);
  
  return null;
}
