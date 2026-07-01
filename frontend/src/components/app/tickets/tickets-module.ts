import { Ticket } from "lucide-react";
import type { ModuleAccess } from "@/components/app/shared/permissions";

export const ticketsModule = {
  title: "Tickets",
  href: "/app/tickets",
  icon: Ticket,
  requiredPermission: "tickets:read",
} satisfies ModuleAccess & {
  title: string;
  href: string;
  icon: typeof Ticket;
};
