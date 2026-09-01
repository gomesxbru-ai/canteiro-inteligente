import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, woPriorityLabels, woStatusLabels } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ordens")({
  component: () => (
    <RequireCompany>
      <OrdersPage />
    </RequireCompany>
  ),
});
const initial = {
  title: "",
  project_id: "",
  assigned_to: "",
  scheduled_for: "",
  priority: "medium" as const,
};
function OrdersPage() {
  const { companyId } = useCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const { data = [] } = useQuery({
    queryKey: ["orders", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("*, projects(name), team_members(name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["project-options", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data;
    },
  });
  const { data: team = [] } = useQuery({
    queryKey: ["team-options", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id,name")
        .eq("company_id", companyId!)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("work_orders").insert({
        company_id: companyId!,
        title: form.title,
        project_id: form.project_id || null,
        assigned_to: form.assigned_to || null,
        scheduled_for: form.scheduled_for || null,
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ordem de serviço criada");
      setOpen(false);
      setForm(initial);
      void qc.invalidateQueries({ queryKey: ["orders", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const status = useMutation({
    mutationFn: async ({
      id,
      value,
    }: {
      id: string;
      value: "open" | "scheduled" | "in_progress" | "done" | "cancelled";
    }) => {
      const { error } = await supabase
        .from("work_orders")
        .update({ status: value, completed_at: value === "done" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["orders", companyId] }),
  });
  return (
    <AppShell
      title="Ordens de serviço"
      description="Planeje, distribua e acompanhe as atividades de campo"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nova OS
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova ordem de serviço</DialogTitle>
              <DialogDescription>Defina a atividade, obra, responsável e prazo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <Picker
                label="Obra"
                value={form.project_id}
                onChange={(v) => setForm({ ...form, project_id: v })}
                items={projects}
              />
              <Picker
                label="Responsável"
                value={form.assigned_to}
                onChange={(v) => setForm({ ...form, assigned_to: v })}
                items={team}
              />
              <div className="space-y-2">
                <Label>Agendamento</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={!form.title || create.isPending} onClick={() => create.mutate()}>
                Criar OS
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
              <TableHead>Atividade</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.title}</TableCell>
                <TableCell>{o.projects?.name || "—"}</TableCell>
                <TableCell>{o.team_members?.name || "Não atribuído"}</TableCell>
                <TableCell>{formatDate(o.scheduled_for)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{woPriorityLabels[o.priority]}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={o.status}
                    onValueChange={(v) => status.mutate({ id: o.id, value: v as typeof o.status })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(woStatusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {!data.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma ordem de serviço.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
function Picker({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Selecione ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((x) => (
            <SelectItem key={x.id} value={x.id}>
              {x.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
