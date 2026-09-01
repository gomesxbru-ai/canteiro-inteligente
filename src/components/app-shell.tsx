import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  HardHat,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
  Wrench,
  UsersRound,
  ChevronDown,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabels } from "@/lib/format";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/obras", label: "Obras", icon: HardHat },
  { to: "/orcamentos", label: "Orçamentos", icon: Receipt },
  { to: "/ordens", label: "Ordens de serviço", icon: Wrench },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/equipe", label: "Equipe", icon: UsersRound },
  { to: "/empresa", label: "Empresa", icon: Building2 },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}) {
  const { company, memberships, setCompanyId, role, userEmail } = useCompany();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="flex size-9 items-center justify-center rounded-md bg-gradient-amber text-sidebar-primary-foreground">
            <HardHat className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ObraFlow</span>
        </div>

        <div className="px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md bg-sidebar-accent px-3 py-2 text-left text-sm text-sidebar-accent-foreground">
                <span className="truncate">
                  <span className="block truncate font-medium">{company?.name ?? "Sem empresa"}</span>
                  <span className="block text-xs opacity-70">{role ? roleLabels[role] : "—"}</span>
                </span>
                <ChevronDown className="size-4 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Minhas empresas</DropdownMenuLabel>
              {memberships.map((m) => (
                <DropdownMenuItem key={m.company_id} onClick={() => setCompanyId(m.company_id)}>
                  {m.companies?.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/onboarding" })}>
                Criar nova empresa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-4 text-xs">
          <p className="truncate opacity-70">{userEmail}</p>
          <button
            onClick={signOut}
            className="mt-2 inline-flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-primary"
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
            <Button variant="ghost" size="sm" className="text-xs" onClick={signOut}>
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
