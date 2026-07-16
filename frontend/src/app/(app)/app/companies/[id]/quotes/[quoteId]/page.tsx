import { Suspense } from "react";
import { QuoteEditorPage } from "@/components/app/quotes/quote-editor-page";
import { ListSkeleton } from "@/components/app/shared/list-states";

interface PageProps {
  params: Promise<{ id: string; quoteId: string }>;
}

export default async function CompanyQuoteDetailPage({ params }: PageProps) {
  const { id, quoteId } = await params;
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <QuoteEditorPage companyId={id} quoteId={quoteId} />
    </Suspense>
  );
}
