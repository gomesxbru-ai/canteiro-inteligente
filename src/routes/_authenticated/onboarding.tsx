import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { userId, userEmail, refetch, setCompanyId } = useCompany();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", cnpj: "", city: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.from("profiles").upsert({ id: userId, email: userEmail });

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          name: form.name,
          cnpj: form.cnpj || null,
          city: form.city || null,
          phone: form.phone || null,
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase
        .from("memberships")
        .insert({ company_id: company.id, user_id: userId, role: "admin", invited_email: userEmail });
      if (memberError) throw memberError;

      setCompanyId(company.id);
      refetch();
      toast.success("Empresa criada com sucesso!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-12">
      <div className="panel w-full max-w-lg p-8">
        <p className="text-eyebrow">Primeiro passo</p>
        <h1 className="mt-2 text-2xl font-semibold">Cadastre sua empresa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada empresa tem seus próprios dados de obras, clientes e equipe. Você será o administrador.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Construtora Alvorada Ltda."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar empresa e continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
