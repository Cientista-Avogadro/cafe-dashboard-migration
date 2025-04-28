import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";

export type User = {
  id: string;
  nome: string;
  email: string;
  password_hash: string;
  propriedade_id: string | null; // Added for property association
  role: "admin" | "gestor" | "operador";
  ativo: boolean;

};

type RegisterData = {
  nome: string;
  email: string;
  password_hash: string;

  role: "admin" | "gestor" | "operador" | undefined;
  ativo: boolean | undefined;
};
import { getQueryFn, queryClient, graphqlRequest } from "@/lib/queryClient";
import { GET_USER_BY_EMAIL, INSERT_USER } from "@/graphql/operations";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { registerSchema } from "@/schemas/register-schema";

import { useToast } from "@/hooks/use-toast";

export type PublicUser = Omit<User, "password_hash">;

type AuthContextType = {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<PublicUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerWithProperty: UseMutationResult<PublicUser, Error, z.infer<typeof registerSchema>>;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: () => {
      const stored = localStorage.getItem("user");
      if (!stored || stored === "undefined") return undefined;
      return JSON.parse(stored);
    },
  });

  const loginMutation = useMutation<PublicUser, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      // Use Hasura to fetch user by email
      const result = await graphqlRequest(
        "GET_USER_BY_EMAIL",
        { email: credentials.email }
      );
      const users = result.users;
      const user = users && users.length > 0 ? users[0] : null;
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      if (user.password_hash !== btoa(credentials.password)) {
        throw new Error("Senha incorreta");
      }
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    onSuccess: (user: PublicUser) => {
      queryClient.setQueryData(["/api/user"], user);
      localStorage.setItem("user", JSON.stringify(user));
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.nome || user.email}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    },
  });

  // New mutation: handles both property and user registration
  const registerWithProperty = useMutation<PublicUser, Error, z.infer<typeof registerSchema>>({
    mutationFn: async (values: z.infer<typeof registerSchema>) => {
      // 1. Create property
      const propertyResult = await graphqlRequest("INSERT_PROPRIEDADE", {
        propriedade: {
          nome: values.propriedade_nome,
          localizacao: values.propriedade_localizacao,
          tamanho: values.propriedade_tamanho ? Number(values.propriedade_tamanho) : undefined,
        },
      });
      const propriedade_id = propertyResult?.insert_propriedades_one?.id;
      if (!propriedade_id) {
        throw new Error("Erro ao criar propriedade");
      }
      // 2. Create user with propriedade_id
      const { nome, email, password, role, ativo } = values;
      const password_hash = btoa(password);
      const result = await graphqlRequest(
        "INSERT_USER",
        {
          user:{
            nome,
            email,
            password_hash,
            role: role || "operador",
            ativo: ativo ?? true,
            propriedade_id,
          }
        }
      );
      const user = result.insert_users_one;
      if (!user) {
        throw new Error("Erro ao registrar usuário");
      }
      return user;
    },
    onSuccess: (user: PublicUser) => {
      queryClient.setQueryData(["/api/user"], user);
      localStorage.setItem("user", JSON.stringify(user));
      toast({
        title: "Registro realizado com sucesso",
        description: `Bem-vindo ao AgroGestão, ${user.nome || user.email}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar sua conta",
        variant: "destructive",
      });
    },
  });

  // Keep the original registerMutation for cases where only user registration is needed


  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Apenas limpa o usuário localmente
      return;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      localStorage.removeItem("user");
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message || "Não foi possível desconectar",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error: error ?? null,
        loginMutation,
        logoutMutation,
        registerWithProperty,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
