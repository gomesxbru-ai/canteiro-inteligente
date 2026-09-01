import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatBRL,
  formatDate,
  projectStatusLabels,
  stageStatusLabels,
  woStatusLabels,
} from "@/lib/format";

type ProjectStatus = Database["public"]["Enums"]["project_status"];
type StageStatus = Database["public"]["Enums"]["stage_status"];

export const Route = createFileRoute("/_authenticated/obras/$id")({
  component: () => (
    <RequireCompany>
      <ProjectDetail />
    </RequireCompany>
  ),
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [stageName, setStageName] = useState("");
  const [stageDue, setStageDue] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [memberToAdd, setMemberToAdd] = useState("");

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const stagesQuery = useQuery({
    queryKey: ["stages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const teamQuery = useQuery({
    queryKey: ["team", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role")
        .eq("company_id", companyId!)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const assignmentsQuery = useQuery({
    queryKey: ["project-assignments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_assignments")
        .select("id, team_member_id, team_members(name, role)")
        .eq("project_id", id);
      if (error) throw error;
      return data;
    },
  });

  const ordersQuery = useQuery({
    queryKey: ["project-orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select("id, title, status, scheduled_for")
        .eq("project_id", id)
        .order("scheduled_for", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const project = projectQuery.data;
  const stages = stagesQuery.data ?? [];

  const updateProject = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("projects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", id] });
      void queryClient.invalidateQueries({ queryKey: ["projects", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_stages").insert({
        company_id: companyId!,
        project_id: id,
        name: stageName,
        due_date: stageDue || null,
        position: stages.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStageName("");
      setStageDue("");
      void queryClient.invalidateQueries({ queryKey: ["stages", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStage = useMutation({
    mutationFn: async ({ stageId, patch }: { stageId: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("project_stages").update(patch).eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["stages", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("project_stages").delete().eq("id", stageId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["stages", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_assignments").insert({
        company_id: companyId!,
        project_id: id,
        team_member_id: memberToAdd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMemberToAdd("");
      void queryClient.invalidateQueries({ queryKey: ["project-assignments", id] });
      void queryClient.invalidateQueries({ queryKey: ["assignments", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("project_assignments").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["project-assignments", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const doneStages = stages.filter((s) => s.status === "done").length;
  const computedProgress = stages.length ? Math.round((doneStages / stages.length) * 100) : null;

  if (projectQuery.isLoading) {
    return (
      <AppShell title="Carregando obra...">
        <p className="text-sm text-muted-foreground">Buscando dados da obra.</p>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell title="Obra não encontrada">
        <Link to="/obras" className="text-sm text-accent">
          Voltar para obras
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={project.name}
      description={`${project.clients?.name ?? "Sem cliente"} · ${project.address ?? "Endereço não informado"}`}
      actions={
        <Link to="/obras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4" /> Obras
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <p className="text-eyebrow">Status</p>
          <Select
            value={project.status}
            onValueChange={(v) => updateProject.mutate({ status: v as ProjectStatus })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(projectStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={project.progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{project.progress}%</span>
          </div>
          {computedProgress !== null && computedProgress !== project.progress ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => updateProject.mutate({ progress: computedProgress })}
            >
              Atualizar progresso para {computedProgress}% (etapas)
            </Button>
          ) : null}
        </div>

        <div className="panel p-5">
          <p className="text-eyebrow">Contrato e prazos</p>
          <p className="mt-2 font-display text-xl font-semibold">{formatBRL(project.contract_cents)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Início {formatDate(project.start_date)} · Entrega {formatDate(project.end_date)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contato: {project.clients?.phone ?? "—"}
          </p>
        </div>

        <div className="panel p-5">
          <p className="text-eyebrow">Diário / observações</p>
          <Textarea
            className="mt-2"
            rows={4}
            value={notes ?? project.notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre ocorrências, medições e pendências da obra"
          />
          <Button
            size="sm"
            className="mt-3"
            disabled={notes === null}
            onClick={() => {
              updateProject.mutate({ notes });
              setNotes(null);
              toast.success("Observações salvas");
            }}
          >
            Salvar
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Etapas da obra</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              placeholder="Nova etapa (ex.: Alvenaria)"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
            <Input
              type="date"
              className="w-40"
              value={stageDue}
              onChange={(e) => setStageDue(e.target.value)}
            />
            <Button onClick={() => addStage.mutate()} disabled={!stageName || addStage.isPending}>
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{formatDate(s.due_date)}</TableCell>
                    <TableCell>
                      <Select
                        value={s.status}
                        onValueChange={(v) =>
                          updateStage.mutate({ stageId: s.id, patch: { status: v as StageStatus } })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(stageStatusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeStage.mutate(s.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {stages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma etapa cadastrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-base font-semibold">Equipe alocada</h2>
            <div className="mt-3 flex gap-2">
              <Select value={memberToAdd} onValueChange={setMemberToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {(teamQuery.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.role ? ` · ${m.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => addMember.mutate()} disabled={!memberToAdd || addMember.isPending}>
                <Plus className="size-4" />
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {(assignmentsQuery.data ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>
                    {a.team_members?.name}
                    <span className="block text-xs text-muted-foreground">{a.team_members?.role ?? ""}</span>
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => removeMember.mutate(a.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              ))}
              {(assignmentsQuery.data ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhum colaborador alocado.</li>
              ) : null}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Ordens de serviço</h2>
              <Link to="/ordens" className="text-xs text-accent hover:underline">
                Gerenciar
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {(ordersQuery.data ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {o.title}
                    <span className="block text-xs text-muted-foreground">{formatDate(o.scheduled_for)}</span>
                  </span>
                  <Badge variant="secondary">{woStatusLabels[o.status]}</Badge>
                </li>
              ))}
              {(ordersQuery.data ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhuma OS vinculada.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
