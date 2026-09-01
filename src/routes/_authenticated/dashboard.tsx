import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardHat, Receipt, Users, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  formatBRL,
  formatDate,
  projectStatusLabels,
  quoteStatusLabels,
  woStatusLabels,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => (
    <RequireCompany>
      <Dashboard />
    </RequireCompany>
  ),
});

function Dashboard() {
  const { companyId, company } = useCompany();

  const { data } = useQuery({
    queryKey: ["dashboard", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [projects, quotes, orders, clients, items] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, status, progress, contract_cents, end_date, clients(name)")
          .eq("company_id", companyId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("quotes")
          .select("id, title, status, discount_cents, created_at, clients(name)")
          .eq("company_id", companyId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("work_orders")
          .select("id, title, status, priority, scheduled_for, projects(name)")
          .eq("company_id", companyId!)
          .order("scheduled_for", { ascending: true, nullsFirst: false }),
        supabase.from("clients").select("id").eq("company_id", companyId!),
        supabase
          .from("quote_items")
          .select("quote_id, quantity, unit_price_cents")
          .eq("company_id", companyId!),
      ]);
      if (projects.error) throw projects.error;
      if (quotes.error) throw quotes.error;
      if (orders.error) throw orders.error;

      const quoteTotals = new Map<string, number>();
      for (const it of items.data ?? []) {
        quoteTotals.set(
          it.quote_id,
          (quoteTotals.get(it.quote_id) ?? 0) + Number(it.quantity) * it.unit_price_cents,
        );
      }

      return {
        projects: projects.data ?? [],
        quotes: (quotes.data ?? []).map((q) => ({
          ...q,
          total: Math.max(0, (quoteTotals.get(q.id) ?? 0) - q.discount_cents),
        })),
        orders: orders.data ?? [],
        clientCount: clients.data?.length ?? 0,
      };
    },
  });

  const projects = data?.projects ?? [];
  const quotes = data?.quotes ?? [];
  const orders = data?.orders ?? [];

  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const contractTotal = projects
    .filter((p) => p.status !== "cancelled")
    .reduce((sum, p) => sum + p.contract_cents, 0);
  const openQuotesValue = quotes
    .filter((q) => q.status === "draft" || q.status === "sent")
    .reduce((sum, q) => sum + q.total, 0);
  const openOrders = orders.filter((o) => o.status !== "done" && o.status !== "cancelled").length;

  const cards = [
    { label: "Obras em execução", value: String(activeProjects), hint: `${projects.length} obras cadastradas`, icon: HardHat },
    { label: "Carteira contratada", value: formatBRL(contractTotal), hint: "Somatório dos contratos", icon: Receipt },
    { label: "Orçamentos em aberto", value: formatBRL(openQuotesValue), hint: `${quotes.length} orçamentos`, icon: Receipt },
    { label: "OS pendentes", value: String(openOrders), hint: `${data?.clientCount ?? 0} clientes ativos`, icon: Wrench },
  ];

  return (
    <AppShell title="Painel" description={company?.name ?? undefined}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">{c.label}</p>
              <c.icon className="size-4 text-accent" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Obras em andamento</h2>
            <Link to="/obras" className="text-xs text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {projects.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                to="/obras/$id"
                params={{ id: p.id }}
                className="block rounded-md border border-border p-4 transition-colors hover:border-accent"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.clients?.name ?? "Sem cliente"} · Prazo {formatDate(p.end_date)}
                    </p>
                  </div>
                  <Badge variant="secondary">{projectStatusLabels[p.status]}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={p.progress} className="h-2" />
                  <span className="text-xs text-muted-foreground">{p.progress}%</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma obra cadastrada ainda. Comece em <Link to="/obras" className="text-accent">Obras</Link>.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Próximas OS</h2>
              <Link to="/ordens" className="text-xs text-accent hover:underline">
                Ver todas
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {orders
                .filter((o) => o.status !== "done" && o.status !== "cancelled")
                .slice(0, 5)
                .map((o) => (
                  <li key={o.id} className="text-sm">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.scheduled_for)} · {woStatusLabels[o.status]}
                      {o.projects?.name ? ` · ${o.projects.name}` : ""}
                    </p>
                  </li>
                ))}
              {openOrders === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhuma OS pendente.</li>
              ) : null}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Orçamentos recentes</h2>
              <Link to="/orcamentos" className="text-xs text-accent hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {quotes.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.clients?.name ?? "Sem cliente"} · {quoteStatusLabels[q.status]}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium">{formatBRL(q.total)}</span>
                </li>
              ))}
              {quotes.length === 0 ? (
                <li className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-3.5" /> Nenhum orçamento ainda.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
