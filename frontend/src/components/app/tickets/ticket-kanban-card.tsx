"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { TicketKanbanItem } from "@/components/app/api/tickets";
import { formatDate } from "@/components/app/shared/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TicketKanbanCardProps {
  ticket: TicketKanbanItem;
  projectId: string;
  draggable: boolean;
  canManageAssignees: boolean;
  onEditAssignees: (ticket: TicketKanbanItem) => void;
  onDragStart: (ticketId: string) => void;
  onDragEnd: () => void;
}

function shortTicketId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function lastAuthorLabel(ticket: TicketKanbanItem) {
  if (!ticket.lastCommentAuthorFirstName && !ticket.lastCommentAuthorLastName) {
    return "Sin mensajes";
  }

  return `${ticket.lastCommentAuthorFirstName ?? ""} ${ticket.lastCommentAuthorLastName ?? ""}`.trim();
}

export function TicketKanbanCard({
  ticket,
  projectId,
  draggable,
  canManageAssignees,
  onEditAssignees,
  onDragStart,
  onDragEnd,
}: TicketKanbanCardProps) {
  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart(ticket.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-border/70 bg-card p-3 shadow-xs transition-shadow",
        draggable ? "cursor-grab active:cursor-grabbing hover:shadow-sm" : "cursor-default",
        ticket.isClosed && "opacity-80",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/app/projects/${projectId}/tickets/${ticket.id}`}
            className="line-clamp-2 text-sm font-semibold text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {ticket.title}
          </Link>
          <p className="font-mono text-[11px] text-muted-foreground">
            #{shortTicketId(ticket.id)}
          </p>
        </div>
        {canManageAssignees ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEditAssignees(ticket);
            }}
            aria-label="Editar responsables"
          >
            <Pencil />
          </Button>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px]">
          {ticket.categoryName ?? "Sin categoría"}
        </Badge>
        {ticket.isClosed ? (
          <Badge variant="secondary" className="text-[10px]">
            Cerrado
          </Badge>
        ) : ticket.isWorking ? (
          <Badge variant="default" className="text-[10px]">
            En trabajo
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            Activo
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Último mensaje: <span className="text-foreground">{lastAuthorLabel(ticket)}</span>
        {ticket.lastCommentAt ? (
          <span className="block text-[11px]">{formatDate(ticket.lastCommentAt)}</span>
        ) : null}
      </p>

      {ticket.assignees && ticket.assignees.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.assignees.slice(0, 3).map((assignee) => (
            <Badge key={assignee.id} variant="secondary" className="text-[10px]">
              {assignee.firstName} {assignee.lastName.charAt(0)}.
            </Badge>
          ))}
          {ticket.assignees.length > 3 ? (
            <Badge variant="outline" className="text-[10px]">
              +{ticket.assignees.length - 3}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
