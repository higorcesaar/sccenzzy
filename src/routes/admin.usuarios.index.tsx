import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listUsers,
  createUser,
  updateUserRole,
  resetUserPassword,
  setUserBan,
  deleteUser,
} from "@/lib/admin/users.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Search, UserPlus, Key, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios/")({
  component: UsersAdminPage,
});

function UsersAdminPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const fetchList = useServerFn(listUsers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { search }],
    queryFn: () => fetchList({ data: { search, page: 1, perPage: 200 } }),
  });

  const create = useServerFn(createUser);
  const updateRole = useServerFn(updateUserRole);
  const resetPw = useServerFn(resetUserPassword);
  const ban = useServerFn(setUserBan);
  const del = useServerFn(deleteUser);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const mCreate = useMutation({
    mutationFn: (input: any) => create({ data: input }),
    onSuccess: () => {
      toast.success("Usuário criado");
      setOpenNew(false);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mRole = useMutation({
    mutationFn: (input: { user_id: string; role: "admin" | "user" }) => updateRole({ data: input }),
    onSuccess: () => {
      toast.success("Papel atualizado");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mReset = useMutation({
    mutationFn: (input: { user_id: string; password: string }) => resetPw({ data: input }),
    onSuccess: () => toast.success("Senha redefinida"),
    onError: (e: any) => toast.error(e.message),
  });

  const mBan = useMutation({
    mutationFn: (input: { user_id: string; banned: boolean }) => ban({ data: input }),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mDel = useMutation({
    mutationFn: (input: { user_id: string }) => del({ data: input }),
    onSuccess: () => {
      toast.success("Usuário excluído");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Sistema</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Usuários</h1>
          <p className="text-sm text-stone-500 mt-1">
            Gerencie contas e permissões do painel administrativo.
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Novo usuário
            </Button>
          </DialogTrigger>
          <NewUserDialog onSubmit={(v) => mCreate.mutate(v)} loading={mCreate.isPending} />
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Buscar por email ou nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-500">Nenhum usuário encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((u: any) => {
                const role = (u.roles?.[0] ?? "user") as "admin" | "user";
                const banned = u.banned_until && new Date(u.banned_until) > new Date();
                const isSelf = u.id === user?.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.display_name || "—"}</div>
                      <div className="text-xs text-stone-500">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={role}
                        onValueChange={(v) => mRole.mutate({ user_id: u.id, role: v as any })}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="destructive">Banido</Badge>
                      ) : u.email_confirmed_at ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-stone-500">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-stone-500">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ResetPasswordButton onSubmit={(pw) => mReset.mutate({ user_id: u.id, password: pw })} />
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title={banned ? "Desbanir" : "Banir"}
                            onClick={() => mBan.mutate({ user_id: u.id, banned: !banned })}
                          >
                            {banned ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldOff className="h-4 w-4 text-amber-600" />}
                          </Button>
                        )}
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Excluir"
                            onClick={() => {
                              if (confirm(`Excluir definitivamente ${u.email}?`)) mDel.mutate({ user_id: u.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function NewUserDialog({ onSubmit, loading }: { onSubmit: (v: any) => void; loading: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [display_name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("admin");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo usuário</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-stone-600">Nome</label>
          <Input value={display_name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">Senha inicial</label>
          <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">Papel</label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin — acesso total ao painel</SelectItem>
              <SelectItem value="user">Usuário — cliente da loja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={loading || !email || password.length < 6}
          onClick={() => onSubmit({ email, password, display_name: display_name || undefined, role })}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar usuário"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ResetPasswordButton({ onSubmit }: { onSubmit: (pw: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Redefinir senha">
          <Key className="h-4 w-4 text-stone-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
        </DialogHeader>
        <Input
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Nova senha (mín. 6)"
        />
        <DialogFooter>
          <Button
            disabled={pw.length < 6}
            onClick={() => {
              onSubmit(pw);
              setPw("");
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
