export const KANBAN_STATUS_ORDER = [
  "Creado",
  "Tomado",
  "En desarrollo",
  "QA",
  "Esperando cliente",
  "Terminado",
  "Cancelado",
] as const;

export type TicketLifecycleFilter = "all" | "active" | "closed";
