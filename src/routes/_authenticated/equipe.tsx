import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, parseBRLToCents } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/equipe")({
  component: () => (
    <RequireCompany>
      <TeamPage />
    </RequireCompany>
  ),
});

function TeamPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", phone: "", rate: "" });

  const { data: members = [] } = useQuery({
    queryKey: ["team", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_assignments")
        .select("team_member_id, projects(name)")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team", companyId] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_members").insert({
        company_id: companyId!,
        name: form.name,
        role: form.role || null,
        phone: form.phone || null,
        daily_rate_cents: parseBRLToCents(form.rate),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Colaborador cadastrado");
      setForm({ name: "", role: "", phone: "", rate: "" });
      setOpen(false);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("team_members").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Colaborador removido");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Equipe"
      description="Colaboradores de campo, funções e custo de diária"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Novo colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo colaborador</DialogTitle>
              <DialogDescription>Cadastre pedreiros, encarregados, eletricistas e técnicos.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input
                  id="role"
                  placeholder="Encarregado"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rate">Diária (R$)</Label>
                <Input
                  id="rate"
                  placeholder="180,00"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Diária</TableHead>
              <TableHead>Obras alocadas</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const projects = assignments
                .filter((a) => a.team_member_id === m.id)
                .map((a) => a.projects?.name)
                .filter(Boolean);
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.name}
                    <span className="block text-xs text-muted-foreground">{m.phone || ""}</span>
                  </TableCell>
                  <TableCell>{m.role || "—"}</TableCell>
                  <TableCell>{formatBRL(m.daily_rate_cents)}</TableCell>
                  <TableCell>
                    {projects.length ? (
                      <div className="flex flex-wrap gap-1">
                        {projects.map((p) => (
                          <Badge key={p} variant="secondary">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.active}
                      onCheckedChange={(active) => toggle.mutate({ id: m.id, active })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(m.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum colaborador cadastrado.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
