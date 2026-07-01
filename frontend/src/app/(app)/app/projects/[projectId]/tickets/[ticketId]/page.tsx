import { TicketDetailPage } from "@/components/app/tickets/ticket-detail-page";

interface TicketDetailRouteProps {
  params: Promise<{ projectId: string; ticketId: string }>;
}

export default async function TicketDetailRoutePage({
  params,
}: TicketDetailRouteProps) {
  const { projectId, ticketId } = await params;
  return <TicketDetailPage projectId={projectId} ticketId={ticketId} />;
}
