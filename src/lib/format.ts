export function formatBRL(cents: number | null | undefined) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseBRLToCents(input: string) {
  const clean = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(clean);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export const projectStatusLabels = {
  planning: "Planejamento",
  in_progress: "Em execução",
  paused: "Pausada",
  done: "Concluída",
  cancelled: "Cancelada",
} as const;

export const stageStatusLabels = {
  pending: "Pendente",
  in_progress: "Em execução",
  done: "Concluída",
} as const;

export const quoteStatusLabels = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
} as const;

export const woStatusLabels = {
  open: "Aberta",
  scheduled: "Agendada",
  in_progress: "Em execução",
  done: "Concluída",
  cancelled: "Cancelada",
} as const;

export const woPriorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
} as const;

export const roleLabels = {
  admin: "Administrador",
  engineer: "Engenharia",
  field: "Campo",
} as const;
