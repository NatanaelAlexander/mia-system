import { Suspense } from "react";
import { CompanyDetailPage } from "@/components/app/companies/company-detail-page";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyDetailRoutePageProps {
  params: Promise<{ id: string }>;
}

function CompanyDetailFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default async function CompanyDetailRoutePage({
  params,
}: CompanyDetailRoutePageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<CompanyDetailFallback />}>
      <CompanyDetailPage companyId={id} />
    </Suspense>
  );
}
