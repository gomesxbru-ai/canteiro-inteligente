import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBRL, formatDate, parseBRLToCents, projectStatusLabels } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/obras/")({
  component: () => (
    <RequireCompany>
      <ProjectsPage />
    </RequireCompany>
  ),
});

const emptyForm = {
  name: "",
  client_id: "",
  address: "",
  start_date: "",
  end_date: "",
  contract: "",
};

function ProjectsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState(emptyForm);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        company_id: companyId!,
        name: form.name,
        client_id: form.client_id || null,
        address: form.address || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        contract_cents: parseBRLToCents(form.contract),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Obra criada");
      setForm(emptyForm);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["projects", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = projects.filter((p) => filter === "all" || p.status === filter);

  return (
    <AppShell
      title="Obras"
      description="Cronograma, progresso e contratos de cada obra"
      actions={
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(projectStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Nova obra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova obra</DialogTitle>
                <DialogDescription>Depois você adiciona etapas, equipe e ordens de serviço.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nome da obra *</Label>
                  <Input
                    id="name"
                    placeholder="Reforma Edifício Aurora"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start">Início</Label>
                  <Input
                    id="start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Prazo final</Label>
                  <Input
                    id="end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="contract">Valor do contrato (R$)</Label>
                  <Input
                    id="contract"
                    placeholder="250.000,00"
                    value={form.contract}
                    onChange={(e) => setForm({ ...form, contract: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
                  Criar obra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <Link
            key={p.id}
            to="/obras/$id"
            params={{ id: p.id }}
            className="panel block p-5 transition-shadow hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">{p.name}</h2>
                <p className="text-xs text-muted-foreground">{p.clients?.name ?? "Sem cliente"}</p>
              </div>
              <Badge variant="secondary">{projectStatusLabels[p.status]}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Contrato</dt>
                <dd className="font-medium">{formatBRL(p.contract_cents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Prazo</dt>
                <dd className="font-medium">{formatDate(p.end_date)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={p.progress} className="h-2" />
              <span className="text-xs text-muted-foreground">{p.progress}%</span>
            </div>
          </Link>
        ))}
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma obra encontrada para esse filtro.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
