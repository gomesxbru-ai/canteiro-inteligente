import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireCompany } from "@/components/require-company";
import { useCompany } from "@/components/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/_authenticated/empresa")({
  component: () => (
    <RequireCompany>
      <CompanyPage />
    </RequireCompany>
  ),
});
function CompanyPage() {
  const { company, companyId, isAdmin, refetch } = useCompany();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", cnpj: "", city: "", phone: "" });
  useEffect(() => {
    if (company)
      setForm({
        name: company.name,
        cnpj: company.cnpj || "",
        city: company.city || "",
        phone: company.phone || "",
      });
  }, [company]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").update(form).eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados da empresa atualizados");
      refetch();
      void qc.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell title="Empresa" description="Dados cadastrais e configurações da organização">
      <div className="panel max-w-2xl p-6">
        <h2 className="text-lg font-semibold">Dados da empresa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estas informações identificam sua organização na plataforma.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Razão social"
            value={form.name}
            set={(v) => setForm({ ...form, name: v })}
          />
          <Field label="CNPJ" value={form.cnpj} set={(v) => setForm({ ...form, cnpj: v })} />
          <Field label="Cidade" value={form.city} set={(v) => setForm({ ...form, city: v })} />
          <Field label="Telefone" value={form.phone} set={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Somente administradores podem alterar estes dados.
          </p>
          <Button disabled={!isAdmin || !form.name || save.isPending} onClick={() => save.mutate()}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );
}
