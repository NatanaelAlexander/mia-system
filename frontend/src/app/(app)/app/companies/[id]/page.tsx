import { CompanyDetailPage } from "@/components/app/companies/company-detail-page";

interface CompanyDetailRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailRoutePage({
  params,
}: CompanyDetailRoutePageProps) {
  const { id } = await params;

  return <CompanyDetailPage companyId={id} />;
}
