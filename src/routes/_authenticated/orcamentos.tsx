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
import { formatBRL, formatDate, parseBRLToCents, quoteStatusLabels } from "@/lib/format";
export const Route = createFileRoute("/_authenticated/orcamentos")({
  component: () => (
    <RequireCompany>
      <QuotesPage />
    </RequireCompany>
  ),
});
const initial = {
  title: "",
  client_id: "",
  valid_until: "",
  description: "",
  quantity: "1",
  unit: "serviço",
  price: "",
};
function QuotesPage() {
  const { companyId } = useCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name")
        .eq("company_id", companyId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data = [] } = useQuery({
    queryKey: ["quotes", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: quotes, error } = await supabase
        .from("quotes")
        .select("*, clients(name)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: items } = await supabase
        .from("quote_items")
        .select("quote_id,quantity,unit_price_cents")
        .eq("company_id", companyId!);
      return (quotes || []).map((q) => ({
        ...q,
        total:
          (items || [])
            .filter((i) => i.quote_id === q.id)
            .reduce((s, i) => s + Number(i.quantity) * i.unit_price_cents, 0) - q.discount_cents,
      }));
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: q, error } = await supabase
        .from("quotes")
        .insert({
          company_id: companyId!,
          title: form.title,
          client_id: form.client_id || null,
          valid_until: form.valid_until || null,
          number: `ORC-${Date.now().toString().slice(-6)}`,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: itemError } = await supabase.from("quote_items").insert({
        company_id: companyId!,
        quote_id: q.id,
        description: form.description || form.title,
        quantity: Number(form.quantity) || 1,
        unit: form.unit,
        unit_price_cents: parseBRLToCents(form.price),
      });
      if (itemError) throw itemError;
    },
    onSuccess: () => {
      toast.success("Orçamento criado");
      setOpen(false);
      setForm(initial);
      void qc.invalidateQueries({ queryKey: ["quotes", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const change = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "draft" | "sent" | "approved" | "rejected";
    }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["quotes", companyId] }),
  });
  return (
    <AppShell
      title="Orçamentos"
      description="Propostas comerciais com composição de custos"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Novo orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo orçamento</DialogTitle>
              <DialogDescription>
                Cadastre a proposta e seu primeiro item de custo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(v) => setForm({ ...form, client_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Item / serviço</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço unitário (R$)</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.title || !form.price || create.isPending}
                onClick={() => create.mutate()}
              >
                Salvar proposta
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
              <TableHead>Número</TableHead>
              <TableHead>Proposta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <Badge variant="outline">{q.number || "—"}</Badge>
                </TableCell>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell>{q.clients?.name || "—"}</TableCell>
                <TableCell>{formatDate(q.valid_until)}</TableCell>
                <TableCell className="font-medium">{formatBRL(q.total)}</TableCell>
                <TableCell>
                  <Select
                    value={q.status}
                    onValueChange={(v) => change.mutate({ id: q.id, status: v as typeof q.status })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(quoteStatusLabels).map(([k, v]) => (
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
                  Nenhum orçamento criado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
