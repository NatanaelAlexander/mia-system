export const TicketStatusName = {
  DRAFT: 'Borrador',
  CREATED: 'Creado',
} as const;

export interface CatalogItem {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string | null;
  statusId: string;
  statusName: string;
  priorityId: string;
  priorityName: string;
  categoryId: string | null;
  categoryName: string | null;
  paymentStatusId: string | null;
  paymentStatusName: string | null;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface TicketStatusHistoryEntry {
  id: string;
  ticketId: string;
  statusId: string;
  statusName: string;
  userId: string;
  createdAt: Date;
}
