import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { graphqlRequest } from "@/lib/queryClient";
import { 
  GET_USERS, 
  INSERT_USER, 
  UPDATE_USER, 
  DELETE_USER 
} from "@/graphql/operations";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Schema para validação do formulário de usuário
const userFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.union([
    z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
    z.string().length(0).optional() // Permite senha vazia (para edição)
  ]),
  role: z.enum(["admin", "gestor", "operador"], {
    required_error: "Selecione um perfil",
  }),
  ativo: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Buscar usuários da propriedade atual
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", user?.propriedade_id],
    queryFn: async () => {
      const result = await graphqlRequest(
        "GET_USERS",
        { propriedade_id: user?.propriedade_id }
      );
      return result.users || [];
    },
    enabled: !!user?.propriedade_id,
  });

  // Formulário para adicionar/editar usuário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      role: "operador",
      ativo: true,
    },
  });

  // Mutation para adicionar usuário
  const addUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const password_hash = values.password ? btoa(values.password) : undefined;
      const result = await graphqlRequest(
        "INSERT_USER",
        {
          user: {
            nome: values.nome,
            email: values.email,
            password_hash,
            role: values.role,
            ativo: values.ativo,
            propriedade_id: user?.propriedade_id,
          },
        }
      );
      return result.insert_users_one;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário adicionado",
        description: "O usuário foi adicionado com sucesso",
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (values: UserFormValues & { id: string }) => {
      const { id, ...userData } = values;
      
      // Remove password if it's empty (not being updated)
      const userDataToSend = { ...userData };
      if (!userData.password || userData.password.trim() === "") {
        delete userDataToSend.password;
        
        // Não enviar password_hash se não houver senha
        const result = await graphqlRequest(
          "UPDATE_USER",
          {
            id,
            user: userDataToSend
          }
        );
        return result.update_users_by_pk;
      } else {
        // Se houver senha, enviar com o password_hash
        const password_hash = btoa(userData.password);
        const result = await graphqlRequest(
          "UPDATE_USER",
          {
            id,
            user: {
              ...userDataToSend,
              password_hash,
            },
          }
        );
        return result.update_users_by_pk;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso",
      });
      setIsOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await graphqlRequest(
        "DELETE_USER",
        { id }
      );
      return result.delete_users_by_pk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para abrir o modal de edição
  const handleEdit = (userData: any) => {
    setEditingUser(userData);
    form.reset({
      nome: userData.nome,
      email: userData.email,
      password: "",  // Não preencher senha na edição
      role: userData.role,
      ativo: userData.ativo,
    });
    setIsOpen(true);
  };

  // Função para abrir o modal de adição
  const handleAdd = () => {
    setEditingUser(null);
    form.reset({
      nome: "",
      email: "",
      password: "",
      role: "operador",
      ativo: true,
    });
    setIsOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  // Função para submeter o formulário
  const onSubmit = (values: UserFormValues) => {
    // Verificação adicional para garantir que a senha seja válida
    if (editingUser) {
      // Se estiver editando e a senha estiver vazia, não valida o comprimento mínimo
      updateUserMutation.mutate({ ...values, id: editingUser.id });
    } else {
      // Se estiver adicionando um novo usuário, a senha é obrigatória
      if (!values.password) {
        form.setError("password", { 
          type: "manual", 
          message: "Senha é obrigatória para novos usuários" 
        });
        return;
      }
      addUserMutation.mutate(values);
    }
  };

  // Renderizar o badge de status do usuário
  const renderStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Ativo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Inativo
      </Badge>
    );
  };

  // Renderizar o badge de perfil do usuário
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Administrador
          </Badge>
        );
      case "gestor":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Gestor
          </Badge>
        );
      case "operador":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            Operador
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {role}
          </Badge>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between md:items-center md:flex-row flex-col space-y-2 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Gestão de Usuários</h2>
          <p className="text-slate-500">
            Gerencie os usuários que têm acesso ao sistema
          </p>
        </div>
        <Button 
          onClick={handleAdd}
          disabled={addUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending}
        >
          {addUserMutation.isPending || updateUserMutation.isPending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Processando...
            </>
          ) : (
            <>
              <i className="ri-user-add-line mr-2"></i>
              Adicionar Usuário
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((userData: any) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">{userData.nome}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>{renderRoleBadge(userData.role)}</TableCell>
                    <TableCell>{renderStatusBadge(userData.ativo)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(userData)}
                        className="mr-1"
                        disabled={updateUserMutation.isPending || addUserMutation.isPending || deleteUserMutation.isPending}
                      >
                        {updateUserMutation.isPending && updateUserMutation.variables?.id === userData.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                        ) : (
                          <i className="ri-edit-line"></i>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(userData.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={userData.id === user?.id || deleteUserMutation.isPending || updateUserMutation.isPending || addUserMutation.isPending} // Não permitir excluir o próprio usuário
                      >
                        {deleteUserMutation.isPending && deleteUserMutation.variables === userData.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
                        ) : (
                          <i className="ri-delete-bin-line"></i>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal para adicionar/editar usuário */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuário" : "Adicionar Usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informações do usuário abaixo."
                : "Preencha as informações do novo usuário."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editingUser ? "Nova Senha (opcional)" : "Senha"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          editingUser
                            ? "Deixe em branco para manter a senha atual"
                            : "Senha do usuário"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="operador">Operador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Administradores têm acesso total, gestores podem gerenciar usuários, e operadores têm acesso limitado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Status do Usuário
                      </FormLabel>
                      <FormDescription>
                        Usuários inativos não podem acessar o sistema.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={addUserMutation.isPending || updateUserMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={addUserMutation.isPending || updateUserMutation.isPending}
                >
                  {(addUserMutation.isPending || updateUserMutation.isPending) ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      {editingUser ? "Salvando..." : "Adicionando..."}
                    </>
                  ) : (
                    editingUser ? "Salvar Alterações" : "Adicionar Usuário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
