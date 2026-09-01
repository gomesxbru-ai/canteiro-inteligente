import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CompanyRole = Database["public"]["Enums"]["company_role"];

export type Membership = {
  id: string;
  role: CompanyRole;
  company_id: string;
  companies: { id: string; name: string; cnpj: string | null; city: string | null } | null;
};

type CompanyContextValue = {
  memberships: Membership[];
  companyId: string | null;
  company: Membership["companies"] | null;
  role: CompanyRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  setCompanyId: (id: string) => void;
  refetch: () => void;
  userId: string | null;
  userEmail: string | null;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);
const STORAGE_KEY = "obraflow.company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const membershipsQuery = useQuery({
    queryKey: ["memberships", userQuery.data?.id],
    enabled: !!userQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("id, role, company_id, companies(id, name, cnpj, city)")
        .eq("user_id", userQuery.data!.id);
      if (error) throw error;
      return (data ?? []) as Membership[];
    },
  });

  const memberships = membershipsQuery.data ?? [];

  useEffect(() => {
    if (!selected && typeof window !== "undefined") {
      setSelected(window.localStorage.getItem(STORAGE_KEY));
    }
  }, [selected]);

  const companyId = useMemo(() => {
    if (selected && memberships.some((m) => m.company_id === selected)) return selected;
    return memberships[0]?.company_id ?? null;
  }, [selected, memberships]);

  const value: CompanyContextValue = {
    memberships,
    companyId,
    company: memberships.find((m) => m.company_id === companyId)?.companies ?? null,
    role: memberships.find((m) => m.company_id === companyId)?.role ?? null,
    isAdmin: memberships.find((m) => m.company_id === companyId)?.role === "admin",
    isLoading: userQuery.isLoading || membershipsQuery.isLoading,
    setCompanyId: (id) => {
      setSelected(id);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
    },
    refetch: () => {
      void membershipsQuery.refetch();
    },
    userId: userQuery.data?.id ?? null,
    userEmail: userQuery.data?.email ?? null,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany deve ser usado dentro de CompanyProvider");
  return ctx;
}
