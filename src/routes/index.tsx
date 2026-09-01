import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: LandingPage });

const features = [
  {
    icon: HardHat,
    title: "Obras sob controle",
    text: "Acompanhe cronograma, etapas, responsáveis e avanço físico em tempo real.",
  },
  {
    icon: Receipt,
    title: "Orçamentos precisos",
    text: "Monte propostas por item, controle descontos e transforme aprovações em obras.",
  },
  {
    icon: ClipboardCheck,
    title: "Operação em campo",
    text: "Organize ordens de serviço por prioridade, data, equipe e cliente.",
  },
  {
    icon: Users,
    title: "Equipe e clientes",
    text: "Centralize contatos, funções, diárias e alocações sem depender de planilhas.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-amber text-accent-foreground">
            <HardHat className="size-5" />
          </span>
          ObraFlow
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#recursos" className="hover:text-foreground">
            Recursos
          </a>
          <a href="#beneficios" className="hover:text-foreground">
            Benefícios
          </a>
          <a href="#seguranca" className="hover:text-foreground">
            Segurança
          </a>
        </nav>
        <Button asChild>
          <Link to="/auth">
            Acessar plataforma <ArrowRight className="size-4" />
          </Link>
        </Button>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div className="absolute -right-52 -top-24 -z-10 size-[34rem] rounded-full bg-accent/10 blur-3xl" />
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm">
              <span className="size-2 rounded-full bg-success" /> Gestão inteligente para construção
              civil
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">
              Sua operação no ritmo da <span className="text-accent">obra.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Do primeiro orçamento à última ordem de serviço: uma plataforma simples para sua
              empresa entregar mais, com margem e previsibilidade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Começar agora <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#recursos">Conhecer recursos</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[
                "Configuração rápida",
                "Dados isolados por empresa",
                "Funciona em qualquer dispositivo",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border bg-card p-3 shadow-lift">
              <div className="rounded-xl bg-gradient-steel p-6 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[.18em] opacity-60">Visão geral</p>
                    <h2 className="mt-1 text-xl font-semibold">Construtora Horizonte</h2>
                  </div>
                  <BarChart3 className="size-6 text-accent" />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <Metric label="Obras ativas" value="12" />
                  <Metric label="Carteira" value="R$ 2,4 mi" />
                  <Metric label="Avanço médio" value="68%" />
                  <Metric label="OS pendentes" value="8" />
                </div>
                <div className="mt-4 rounded-lg bg-white/8 p-4">
                  <div className="flex justify-between text-xs">
                    <span>Edifício Aurora</span>
                    <span>74%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/15">
                    <div className="h-2 w-3/4 rounded-full bg-accent" />
                  </div>
                  <div className="mt-4 flex justify-between text-xs">
                    <span>Galpão Industrial Norte</span>
                    <span>51%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/15">
                    <div className="h-2 w-1/2 rounded-full bg-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="border-y bg-surface/60 py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="text-eyebrow">Tudo conectado</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
              Menos improviso. Mais produtividade em cada etapa.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="panel p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="beneficios"
          className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8"
        >
          <div>
            <p className="text-eyebrow">Gestão que dá resultado</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Decisões melhores começam com informação organizada.
            </h2>
          </div>
          <div className="grid gap-5">
            {[
              "Tenha uma visão financeira da carteira contratada e das propostas em aberto.",
              "Identifique atrasos antes que eles comprometam prazo e margem.",
              "Dê autonomia ao campo sem perder o controle da operação.",
            ].map((x, i) => (
              <div key={x} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  0{i + 1}
                </span>
                <p className="pt-1 text-muted-foreground">{x}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="seguranca" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-steel p-8 text-primary-foreground sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <ShieldCheck className="mb-4 size-8 text-accent" />
              <h2 className="text-3xl font-semibold">Pronto para profissionalizar sua operação?</h2>
              <p className="mt-3 opacity-75">
                Ambiente seguro, dados protegidos por empresa e uma experiência feita para o dia a
                dia da construção.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/auth">
                Criar minha conta <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <span>© 2026 ObraFlow. Gestão para quem constrói.</span>
          <span>Obras • Orçamentos • Equipes • Ordens de serviço</span>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/8 p-4">
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
