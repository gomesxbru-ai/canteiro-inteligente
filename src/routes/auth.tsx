import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ObraFlow | Gestão para construção civil" },
      {
        name: "description",
        content:
          "Acesse o ObraFlow para gerenciar obras, orçamentos, ordens de serviço e equipes da sua construtora.",
      },
      { property: "og:title", content: "Entrar no ObraFlow" },
      {
        property: "og:description",
        content: "Plataforma de gestão para empresas prestadoras de serviços da construção civil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const isRecoveryRedirect = window.location.href.includes("type=recovery");
    if (isRecoveryRedirect) setRecovering(true);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !isRecoveryRedirect) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
        return;
      }
      if (
        session &&
        !isRecoveryRedirect &&
        (event === "SIGNED_IN" || event === "INITIAL_SESSION")
      ) {
        navigate({ to: "/dashboard", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!data.session) {
      const message = "Não foi possível iniciar sua sessão. Tente novamente.";
      setFormError(message);
      toast.error(message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!data.session) {
      setPendingConfirm(true);
      toast.success("Conta criada! Confirme seu e-mail para acessar.");
    }
  }

  async function google() {
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      setFormError(message);
      toast.error(message);
      return;
    }
  }

  async function resetPassword() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setFormError("Informe seu e-mail para redefinir a senha.");
      return;
    }

    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      setFormError(message);
      toast.error(message);
      return;
    }
    toast.success("Enviamos as instruções de recuperação para seu e-mail.");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const message = authErrorMessage(error);
      setFormError(message);
      toast.error(message);
      return;
    }
    toast.success("Senha atualizada com sucesso.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-steel p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-gradient-amber text-accent-foreground">
            <HardHat className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">ObraFlow</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold">Da proposta à entrega da obra, num só lugar.</h2>
          <p className="mt-4 text-sm opacity-80">
            Orçamentos com composição de custos, cronograma por etapa, ordens de serviço no campo e
            controle de equipe — com dados isolados por empresa.
          </p>
        </div>
        <p className="text-xs opacity-60">
          Feito para construtoras, empreiteiras e prestadores de serviço.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Acesse sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie obras, equipes e orçamentos da sua empresa.
          </p>

          {pendingConfirm ? (
            <div className="panel mt-6 p-4 text-sm">
              Enviamos um link de confirmação para <strong>{email}</strong>. Confirme o e-mail e
              volte aqui para entrar.
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          {recovering ? (
            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-password">Crie uma nova senha</Label>
                <Input
                  id="recovery-password"
                  type="password"
                  name="recovery-password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    onClick={resetPassword}
                    disabled={loading}
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input
                      id="email2"
                      name="signup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Senha</Label>
                    <Input
                      id="password2"
                      type="password"
                      required
                      minLength={6}
                      name="new-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!recovering ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou{" "}
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={google} disabled={loading}>
                Continuar com Google
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type AuthErrorLike = {
  message: string;
  code?: string | undefined;
  status?: number | undefined;
};

function authErrorMessage(error: AuthErrorLike) {
  const value = `${error.code ?? ""} ${error.message}`.toLowerCase();

  if (value.includes("invalid login credentials") || value.includes("invalid_credentials")) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  if (value.includes("email not confirmed") || value.includes("email_not_confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada.";
  }
  if (value.includes("user already registered") || value.includes("user_already_exists")) {
    return "Este e-mail já possui uma conta. Entre com sua senha ou use a recuperação de acesso.";
  }
  if (value.includes("weak password") || value.includes("password should be")) {
    return "Crie uma senha mais forte, com pelo menos 6 caracteres.";
  }
  if (value.includes("rate limit") || error.status === 429) {
    return "Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.";
  }
  if (value.includes("provider is not enabled") || value.includes("unsupported provider")) {
    return "O login com Google ainda não está habilitado. Use seu e-mail e senha.";
  }
  if (error.status === 422) {
    return "Os dados de acesso não foram aceitos. Confira o e-mail e a senha ou recupere seu acesso.";
  }
  if (value.includes("fetch") || value.includes("network")) {
    return "Não foi possível conectar ao serviço de acesso. Verifique sua conexão e tente novamente.";
  }
  return error.message && error.message !== "missing_session"
    ? `Não foi possível acessar: ${error.message}`
    : "Não foi possível iniciar sua sessão. Tente novamente.";
}
