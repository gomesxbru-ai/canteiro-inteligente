import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCompany } from "@/components/company-context";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireCompany({ children }: { children: ReactNode }) {
  const { companyId, isLoading } = useCompany();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !companyId) navigate({ to: "/onboarding", replace: true });
  }, [isLoading, companyId, navigate]);

  if (isLoading || !companyId) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
