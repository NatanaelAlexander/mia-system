export const TicketStatusName = {
  DRAFT: 'Borrador',
  CREATED: 'Creado',
  TAKEN: 'Tomado',
  IN_DEVELOPMENT: 'En desarrollo',
  QA: 'QA',
  WAITING_CLIENT: 'Esperando cliente',
  FINISHED: 'Terminado',
  CANCELLED: 'Cancelado',
} as const;

export const TICKET_CLOSED_STATUS_NAMES = new Set<string>([
  TicketStatusName.FINISHED,
  TicketStatusName.CANCELLED,
]);

export const TICKET_WORKING_STATUS_NAMES = new Set<string>([
  TicketStatusName.TAKEN,
  TicketStatusName.IN_DEVELOPMENT,
  TicketStatusName.QA,
  TicketStatusName.WAITING_CLIENT,
]);

export type TicketLifecycleFilter = 'all' | 'active' | 'closed';

export type TicketTimelineRange = 'day' | 'month' | 'year';

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

export interface TicketAssignee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isSuperAdmin: boolean;
}

export interface TicketKanbanItem extends Ticket {
  lastCommentAuthorFirstName: string | null;
  lastCommentAuthorLastName: string | null;
  lastCommentAt: Date | null;
  isClosed: boolean;
  isWorking: boolean;
  assignees?: TicketAssignee[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: Date;
  authorFirstName: string;
  authorLastName: string;
  authorJobTitles: string[];
  authorIsClient: boolean;
}

export interface TicketStatusHistoryEntry {
  id: string;
  ticketId: string;
  statusId: string;
  statusName: string;
  userId: string;
  createdAt: Date;
}

export interface TicketTimelinePoint {
  date: Date;
  total: number;
  open: number;
  closed: number;
}
