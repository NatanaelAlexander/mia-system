import { Suspense } from "react";
import { QuoteEditorPage } from "@/components/app/quotes/quote-editor-page";
import { ListSkeleton } from "@/components/app/shared/list-states";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewCompanyQuotePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <QuoteEditorPage companyId={id} />
    </Suspense>
  );
}
